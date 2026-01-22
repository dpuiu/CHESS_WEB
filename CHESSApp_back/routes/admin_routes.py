# Admin routes for the CHESS Web App
# Routes for database management and administrative functions

from flask import Blueprint, jsonify, request
from db.methods.database import admin as db_admin
from db.methods.genomes import admin as genome_admin
from db.methods.sources import admin as source_admin
from db.methods.datasets import admin as dataset_admin
from db.methods.configurations import admin as config_admin
from db.methods.configurations import utils as config_utils
from db.methods.configurations import queries as config_queries
from db.methods import db
from sqlalchemy import text
from middleware import *
from db.methods.genomes.queries import *
from db.methods.TempFileManager import get_temp_file_manager
import os

admin_bp = Blueprint('admin', __name__)

# ============================================================================
# DATABASE MANAGEMENT ROUTES
# ============================================================================

@admin_bp.route('/db_config', methods=['GET'])
def db_config():
    """
    Returns the database configuration.
    Returns success with null data_dir if not configured yet.
    """
    res = db_admin.get_database_config()
    # Return success even if data_dir is None - frontend needs to handle unconfigured state
    return jsonify({"success": True, "data": res["data_dir"]})

@admin_bp.route('/set_db_config', methods=['POST'])
def set_db_config():
    """
    Updates the database configuration.
    """
    res = db_admin.update_database_config(request.json["data_dir"])
    if not res["success"]:
        return jsonify(res), 500
    return jsonify({"success": True, "data": res["data"]})

@admin_bp.route('/create_backup', methods=['POST'])
@require_json
@validate_required_fields(['backup_path'])
def create_backup():
    """
    Creates a backup of the database.
    Request body should contain: {"backup_path": "/path/to/backup.sql"}
    """
    try:
        data = request.get_json()
        backup_path = data.get('backup_path')
        
        result = db_admin.create_backup(backup_path)
        if result["success"]:
            return jsonify(result)
        else:
            return jsonify(result), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to create backup: {str(e)}"}), 500

@admin_bp.route('/restore_backup', methods=['POST'])
@require_json
@validate_required_fields(['backup_path', 'storage_dir_path'])
def restore_backup():
    """
    Restores the database from a backup file.
    Request body should contain: {"backup_path": "/path/to/backup.sql"}
    """
    try:
        data = request.get_json()
        backup_path = data.get('backup_path')
        storage_dir_path = data.get('storage_dir_path')
        
        result = db_admin.restore_backup(backup_path, storage_dir_path)
        if result["success"]:
            return jsonify(result)
        else:
            return jsonify(result), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to restore backup: {str(e)}"}), 500

@admin_bp.route('/db_list', methods=['GET'])
def db_list():
    """
    Returns a list of all database tables and views with their descriptions.
    Used for the initial database management page load.
    """
    try:
        # Get actual tables and views separately
        actual_tables = db_admin.list_tables()
        views = db_admin.list_views()
        
        # Get table/view descriptions using admin methods
        tables_info = []
        for table_name in actual_tables:
            try:
                # Get table description using admin method
                table_info = db_admin.get_table_info(table_name)
                table_info["type"] = "table"
                tables_info.append(table_info)
            except Exception as e:
                table_info = {
                    "name": table_name,
                    "type": "table", 
                    "description": "",
                    "message": str(e)
                }
                tables_info.append(table_info)
        
        views_info = []
        for view_name in views:
            try:
                # Get view description using admin method
                view_info = db_admin.get_table_info(view_name)
                view_info["type"] = "view"
                views_info.append(view_info)
            except Exception as e:
                view_info = {
                    "name": view_name,
                    "type": "view",
                    "description": "",
                    "message": str(e)
                }
                views_info.append(view_info)
        
        return jsonify({
            "success": True,
            "tables": tables_info,
            "views": views_info,
            "total_tables": len(tables_info),
            "total_views": len(views_info)
        })
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to get database list: {str(e)}"}), 500

@admin_bp.route('/db_table_data/<table_name>', methods=['GET'])
def db_table_data(table_name):
    """
    Returns the schema and data for a specific table or view.
    Used when user expands a table/view in the database management page.
    
    Query Parameters:
        search (str, optional): Search term to filter results across all columns
        limit (int, optional): Maximum number of rows to return (default: 10)
    """
    try:
        # Get query parameters
        search_term = request.args.get('search', '').strip() or None
        limit = request.args.get('limit', 10, type=int)
        
        # Validate limit
        if limit < 1 or limit > 100:
            limit = 10  # Default to 10 if invalid
        
        # Validate table name to prevent SQL injection
        all_tables = db_admin.list_tables()
        all_views = db_admin.list_views()
        
        if table_name not in all_tables and table_name not in all_views:
            return jsonify({"success": False, "message": f"Table or view '{table_name}' not found"}), 404
        
        # Get table data
        table_data = db_admin.get_table_preview(table_name, limit=limit, search_term=search_term)
        
        return jsonify({
            "success": True,
            "table_name": table_name,
            "data": table_data,
            "search_term": search_term,
            "limit": limit
        })
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to get table data: {str(e)}"}), 500

@admin_bp.route('/reset_db', methods=['POST'])
def reset_db():
    """
    Resets the entire database by truncating all tables.
    WARNING: This is a destructive operation!
    """
    result = db_admin.reset_database()
    if result["success"]:
        db.session.commit()
        return jsonify(result)
    else:
        db.session.rollback()
        return jsonify(result), 500

@admin_bp.route('/clear_table', methods=['POST'])
@require_json
@validate_required_fields(['table_name'])
def clear_table():
    """
    Clears all rows from a specific table.
    """
    try:
        data = request.get_json()
        table_name = data.get('table_name')
    
        actual_tables = db_admin.list_tables()
        if table_name not in actual_tables:
            return jsonify({"success": False, "message": f"Table '{table_name}' does not exist or is a view"}), 400
        
        result = db_admin.clear_table(table_name)
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 500
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to clear table: {str(e)}"}), 500

# ============================================================================
# ORGANISM MANAGEMENT ROUTES
# ============================================================================

@admin_bp.route('/organisms', methods=['POST'])
@require_json
@validate_required_fields(['taxonomy_id', 'scientific_name', 'common_name'])
def add_organism():
    """
    Adds a new organism to the database.
    """
    try:
        data = request.get_json()
        result = genome_admin.add_organism(
            taxonomy_id=data['taxonomy_id'],
            scientific_name=data['scientific_name'].strip(),
            common_name=data['common_name'].strip(),
            information=data.get('information', '').strip()
        )
        
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to add organism: {str(e)}"}), 500

@admin_bp.route('/organisms/<int:taxonomy_id>', methods=['PUT'])
@require_json
@validate_required_fields(['scientific_name', 'common_name'])
def update_organism(taxonomy_id):
    """
    Updates an existing organism in the database.
    """
    try:
        data = request.get_json()
        result = genome_admin.update_organism(
            taxonomy_id=taxonomy_id,
            scientific_name=data['scientific_name'].strip(),
            common_name=data['common_name'].strip(),
            information=data.get('information', '').strip()
        )
        
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to update organism: {str(e)}"}), 500

@admin_bp.route('/organisms/<int:taxonomy_id>', methods=['DELETE'])
def delete_organism(taxonomy_id):
    """
    Deletes an organism from the database.
    """
    try:
        result = genome_admin.delete_organism(taxonomy_id)
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to delete organism: {str(e)}"}), 500

# ============================================================================
# ASSEMBLY MANAGEMENT ROUTES
# ============================================================================

@admin_bp.route('/assemblies', methods=['POST'])
@require_json
@validate_required_fields(['assembly_name', 'taxonomy_id'])
def add_assembly():
    """
    Adds a new assembly to the database.
    """
    try:
        data = request.get_json()
        result = genome_admin.add_assembly(
            assembly_name=data['assembly_name'].strip(),
            taxonomy_id=data['taxonomy_id'],
            information=data.get('information', '').strip()
        )
        
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to add assembly: {str(e)}"}), 500

@admin_bp.route('/assemblies/<int:assembly_id>', methods=['PUT'])
@require_json
@validate_required_fields(['assembly_name', 'taxonomy_id'])
def update_assembly(assembly_id):
    """
    Updates an existing assembly in the database.
    """
    try:
        data = request.get_json()
        result = genome_admin.update_assembly(
            assembly_id=assembly_id,
            assembly_name=data['assembly_name'].strip(),
            taxonomy_id=data['taxonomy_id'],
            information=data.get('information', '').strip()
        )
        
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to update assembly: {str(e)}"}), 500

@admin_bp.route('/assemblies/<int:assembly_id>', methods=['DELETE'])
def delete_assembly(assembly_id):
    """
    Deletes an assembly from the database.
    """
    try:
        result = genome_admin.delete_assembly(assembly_id)
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to delete assembly: {str(e)}"}), 500

# ============================================================================
# FILE UPLOAD ROUTES
# ============================================================================

@admin_bp.route('/assemblies/upload-fasta', methods=['POST'])
@validate_content_length(max_size_mb=50000)
def upload_fasta():
    """
    Uploads a FASTA file for an assembly.
    """
    try:
        if 'fasta_file' not in request.files:
            return jsonify({"success": False, "message": "No file provided"}), 400
        
        file = request.files['fasta_file']
        assembly_id = request.form.get('assembly_id')
        nomenclature = request.form.get('nomenclature')
        try:
            assembly_id = int(assembly_id)
        except (ValueError, TypeError):
            return jsonify({"success": False, "message": "Assembly ID must be a valid integer"}), 400
        
        result = genome_admin.process_fasta_file(assembly_id, nomenclature, file)
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to upload FASTA file: {str(e)}"}), 500

# ============================================================================
# NOMENCLATURE MANAGEMENT ROUTES
# ============================================================================

@admin_bp.route('/assemblies/<int:assembly_id>/nomenclatures/upload-tsv', methods=['POST'])
@validate_content_length(max_size_mb=50)  # 50MB for TSV files
def upload_nomenclature_tsv(assembly_id):
    """
    Uploads a TSV nomenclature file for an assembly.
    """
    try:
        if 'tsv_file' not in request.files:
            return jsonify({"success": False, "message": "No file provided"}), 400
        
        tsv_file = request.files['tsv_file']
        if tsv_file.filename == '':
            return jsonify({"success": False, "message": "No file selected"}), 400
        
        source_nomenclature = request.form.get('source_nomenclature')
        if not source_nomenclature:
            return jsonify({"success": False, "message": "Nomenclature is required"}), 400
        
        new_nomenclature = request.form.get('new_nomenclature')
        if not new_nomenclature:
            return jsonify({"success": False, "message": "New nomenclature is required"}), 400
        
        # Upload file
        result = genome_admin.process_nomenclature_tsv(tsv_file, assembly_id, source_nomenclature, new_nomenclature)
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            raise Exception(result["message"])
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to upload nomenclature TSV: {str(e)}"}), 500
    finally:
        temp_manager = get_temp_file_manager()
        temp_manager.cleanup_all()

# ============================================================================
# CONFIGURATION MANAGEMENT ROUTES
# ============================================================================

@admin_bp.route('/configurations', methods=['POST'])
@require_json
@validate_required_fields(['description', 'organism_id', 'assembly_id', 'nomenclature', 'source_id', 'sv_id', 'sequence_id', 'start', 'end'])
def create_configuration():
    """
    Create a new configuration
    """
    try:
        data = request.get_json()
        result = config_admin.create_configuration(data)
        
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to create configuration: {str(e)}"}), 500

@admin_bp.route('/configurations/<int:configuration_id>', methods=['PUT'])
@require_json
def update_configuration(configuration_id):
    """
    Update an existing configuration
    """
    try:
        data = request.get_json()
        result = config_admin.update_configuration(configuration_id, data)
        
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to update configuration: {str(e)}"}), 500

@admin_bp.route('/configurations/<int:configuration_id>', methods=['DELETE'])
def delete_configuration(configuration_id):
    """
    Delete a configuration
    """
    try:
        result = config_admin.delete_configuration(configuration_id)
        
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to delete configuration: {str(e)}"}), 500

@admin_bp.route('/configurations/<int:configuration_id>/activate', methods=['POST'])
def activate_configuration(configuration_id):
    """
    Set a configuration as active
    """
    try:
        result = config_admin.set_active_configuration(configuration_id)
        
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to activate configuration: {str(e)}"}), 500

@admin_bp.route('/assemblies/<int:assembly_id>/nomenclatures/<nomenclature>', methods=['DELETE'])
def remove_nomenclature_from_assembly(assembly_id, nomenclature):
    """
    Removes a nomenclature from an assembly.
    """
    try:
        result = genome_admin.remove_nomenclature_from_assembly(assembly_id, nomenclature)
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to remove nomenclature: {str(e)}"}), 500

# ============================================================================
# SOURCE MANAGEMENT ROUTES
# ============================================================================

@admin_bp.route('/add_to_source', methods=['POST'])
@require_json
@validate_required_fields(['name'])
def add_to_source():
    """
    Adds a new source to the database.
    """
    try:
        data = request.get_json()

        name = data.get('name')
        information = data.get('information', '')
        link = data.get('link', '')
        citation = data.get('citation', '')

        source_data = {
            "name": name.strip(),
            "information": information.strip(),
            "link": link.strip(),
            "citation": citation.strip(),
        }
        
        result = source_admin.add_source(source_data)
        
        if result["success"]:
            db.session.commit()
            return jsonify({
                "success": True,
                "message": result["message"],
                "source_id": result["source_id"]
            })
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to add source: {str(e)}"}), 500

@admin_bp.route('/sources/<int:source_id>', methods=['PUT'])
@require_json
@validate_required_fields(['name'])
def update_source(source_id):
    """
    Updates a source.
    """
    try:
        data = request.get_json()

        source_data = {
            "name": data['name'].strip(),
            "information": data.get('information', '').strip(),
            "link": data.get('link', '').strip(),
            "citation": data.get('citation', '').strip()
        }

        result = source_admin.update_source(
            source_id=source_id,
            data=source_data
        )
        
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to update source: {str(e)}"}), 500

@admin_bp.route('/sources/<int:source_id>', methods=['DELETE'])
def delete_source(source_id):
    """
    Deletes a source.
    """
    try:
        result = source_admin.delete_source(source_id)
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to delete source: {str(e)}"}), 500

# ============================================================================
# SOURCE VERSION MANAGEMENT ROUTES
# ============================================================================

@admin_bp.route('/sources/<int:source_id>/source-versions', methods=['POST'])
@require_json
@validate_required_fields(['version_name'])
def add_source_version(source_id):
    """
    Adds a new source version.
    """
    try:
        data = request.get_json()
        
        source_version_data = {
            "source_id": source_id,
            "version_name": data['version_name'].strip(),
            "information": data.get('information', '').strip()
        }
        
        result = source_admin.add_source_version(data=source_version_data)
        
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to add source version: {str(e)}"}), 500

@admin_bp.route('/sources/<int:source_id>/source-versions/<int:sv_id>', methods=['DELETE'])
def delete_source_version(source_id, sv_id):
    """
    Deletes a source version.
    """
    try:
        result = source_admin.delete_source_version(sv_id)
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to delete source version: {str(e)}"}), 500

@admin_bp.route('/sources/<int:source_id>/source-versions/<int:sv_id>/assemblies/<int:sva_id>', methods=['DELETE'])
def delete_source_version_assembly(source_id, sv_id, sva_id):
    """
    Deletes a source version assembly.
    """
    try:
        result = source_admin.delete_source_version_assembly(sva_id)
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to delete source version assembly: {str(e)}"}), 500

@admin_bp.route('/sources/<int:source_id>/source-versions/reorder', methods=['POST'])
@require_json
@validate_required_fields(['new_order'])
def reorder_source_versions(source_id):
    """
    Reorders source versions by changing their rank.
    """
    try:
        data = request.get_json()

        result = source_admin.reorder_source_versions(source_id, data['new_order'])
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to reorder source versions: {str(e)}"}), 500

# ============================================================================
# ANNOTATION UPLOAD ROUTES
# ============================================================================

@admin_bp.route('/sources/<int:source_id>/source-versions/<int:sv_id>/upload-gtf', methods=['POST'])
@validate_content_length(max_size_mb=50000)
def upload_gtf(source_id, sv_id):
    """
    Uploads a GTF annotation file for a source version.
    """
    try:
        # Check if file was uploaded
        if 'gtf_file' not in request.files:
            return jsonify({"success": False, "message": "No file provided"}), 400
        
        gtf_file = request.files['gtf_file']
        if gtf_file.filename == '':
            return jsonify({"success": False, "message": "No file selected"}), 400

        data = {
            "file": gtf_file,
            "source_id": source_id,
            "source_version_id": sv_id,
            "assembly_id": int(request.form.get('assembly_id')),
            "description": request.form.get('description', '')
        }

        result = source_admin.verify_annotation_file_upload_data(data)
        if result["success"]:
            return jsonify(result)
        else:
            return jsonify(result), 400
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to upload GTF file: {str(e)}"}), 500

@admin_bp.route('/sources/<int:source_id>/source-versions/<int:sv_id>/confirm-annotation', methods=['POST'])
@require_json
@validate_required_fields(['selected_nomenclature', 'transcript_type_key', 'gene_type_key', 'gene_name_key', 'attribute_types', 'categorical_attribute_values', 'assembly_id', 'source_version_id', 'description', 'temp_file_path', 'norm_gtf_path'])
def confirm_annotation_upload(source_id, sv_id):
    """
    Confirms the upload of annotation files and processes them.
    """
    try:
        data = request.get_json()

        data["source_id"] = source_id
        data["source_version_id"] = sv_id
        
        result = source_admin.confirm_and_process_annotation_file(data)
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to confirm annotation upload: {str(e)}"}), 500
    finally:
        temp_manager = get_temp_file_manager()
        temp_manager.cleanup_all()

# ============================================================================
# DATASET MANAGEMENT ROUTES
# ============================================================================

@admin_bp.route('/datasets/add_data_type', methods=['POST'])
@require_json
@validate_required_fields(['data_type', 'description'])
def add_data_type():
    """
    Add a new data type.
    """
    try:
        data = request.get_json()
        data_type = data['data_type'].strip()
        description = data['description'].strip()

        result = dataset_admin.add_data_type(data_type, description)
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to add data type: {str(e)}"}), 500
        
@admin_bp.route('/datasets/edit_data_type', methods=['POST'])
@require_json
@validate_required_fields(['data_type', 'description'])
def edit_data_type():
    """
    Edit a data type.
    """
    try:
        data = request.get_json()
        data_type = data['data_type'].strip()
        description = data['description'].strip()

        result = dataset_admin.edit_data_type(data_type, description)
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to edit data type: {str(e)}"}), 500

@admin_bp.route('/datasets/delete_data_type', methods=['POST'])
@require_json
@validate_required_fields(['data_type'])
def delete_data_type():
    """
    Delete a data type.
    """
    try:
        data = request.get_json()
        data_type = data['data_type'].strip()
        
        result = dataset_admin.delete_data_type(data_type)

        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to delete data type: {str(e)}"}), 500


@admin_bp.route('/datasets', methods=['POST'])
@validate_content_length(max_size_mb=102400)
def create_dataset():
    """
    Create a new dataset with TSV file upload.
    """
    try:
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({"success": False, "message": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"success": False, "message": "No file selected"}), 400
        
        # Get form data
        name = request.form.get('name', '').strip()
        description = request.form.get('description', '').strip()
        data_type = request.form.get('data_type', '').strip()
        sva_id = request.form.get('sva_id')
        
        # Validate required fields
        if not name:
            return jsonify({"success": False, "message": "Dataset name is required"}), 400
        
        if not description:
            return jsonify({"success": False, "message": "Dataset description is required"}), 400
        
        if not data_type:
            return jsonify({"success": False, "message": "Data type is required"}), 400
        
        if not sva_id:
            return jsonify({"success": False, "message": "Source version assembly ID is required"}), 400
        
        try:
            sva_id = int(sva_id)
        except (ValueError, TypeError):
            return jsonify({"success": False, "message": "Source version assembly ID must be a valid integer"}), 400
        
        dataset_data = {
            "name": name,
            "description": description,
            "data_type": data_type,
            "sva_id": sva_id,
            "file": file
        }
        
        result = dataset_admin.create_dataset(dataset_data)
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to create dataset: {str(e)}"}), 500

@admin_bp.route('/datasets/<int:dataset_id>', methods=['PUT'])
@require_json
@validate_required_fields(['name', 'description'])
def update_dataset(dataset_id):
    """
    Update an existing dataset.
    """
    try:
        data = request.get_json()

        dataset_data = {
            "name": data['name'].strip(),
            "description": data.get('description', '').strip(),
            "data_type": data.get('data_type', '').strip()
        }
        
        result = dataset_admin.update_dataset(dataset_id, dataset_data)
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to update dataset: {str(e)}"}), 500

@admin_bp.route('/datasets/<int:dataset_id>', methods=['DELETE'])
def delete_dataset(dataset_id):
    """
    Delete a dataset.
    """
    try:
        result = dataset_admin.delete_dataset(dataset_id)
        if result["success"]:
            db.session.commit()
            return jsonify(result)
        else:
            db.session.rollback()
            return jsonify(result), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to delete dataset: {str(e)}"}), 500
