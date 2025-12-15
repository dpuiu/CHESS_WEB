from sqlalchemy import text
from db.db import db, to_absolute_path
from db.methods.utils import *

def source_exists_by_name(source_name):
    try:
        result = db.session.execute(text("""
            SELECT COUNT(*) FROM source WHERE name = :name
        """), {"name": source_name}).fetchone()
        return result[0] > 0
    except Exception as e:
        return False

def source_exists_by_id(source_id):
    try:
        result = db.session.execute(text("""
            SELECT COUNT(*) FROM source WHERE source_id = :id
        """), {"id": source_id}).fetchone()
        return result[0] > 0
    except Exception as e:
        return False

def get_source_by_name(source_name):
    try:
        result = db.session.execute(text("""
            SELECT source_id, name, information, link, citation FROM source WHERE name = :name
        """), {"name": source_name}).fetchone()
        return result
    except Exception as e:
        return None

def get_source_by_id(source_id):
    try:
        result = db.session.execute(text("""
            SELECT source_id, name, information, link, citation FROM source WHERE source_id = :id
        """), {"id": source_id}).fetchone()
        return result
    except Exception as e:
        return None

def source_version_exists(source_id, version_name):
    try:
        result = db.session.execute(text("""
            SELECT COUNT(*) FROM source_version WHERE source_id = :source_id AND version_name = :version_name
        """), {"source_id": source_id, "version_name": version_name}).fetchone()
        return result[0] > 0
    except Exception as e:
        return False

def source_version_exists_by_id(sv_id):
    try:
        result = db.session.execute(text("""
            SELECT COUNT(*) FROM source_version WHERE sv_id = :sv_id
        """), {"sv_id": sv_id}).fetchone()
        return result[0] > 0
    except Exception as e:
        return False

def source_version_assembly_exists_by_ids(sv_id, assembly_id):
    try:
        result = db.session.execute(text("""
            SELECT COUNT(*) FROM source_version_assembly WHERE sv_id = :sv_id AND assembly_id = :assembly_id
        """), {"sv_id": sv_id, "assembly_id": assembly_id}).fetchone()
        return result[0] > 0
    except Exception as e:
        return False

def get_files_by_source_id(source_id):
    try:
        result = db.session.execute(text("""
            SELECT file_path, nomenclature, filetype
            FROM source_file
            JOIN source_version_assembly ON source_file.sva_id = source_version_assembly.sva_id
            JOIN source_version ON source_version_assembly.sv_id = source_version.sv_id
            WHERE source_version.source_id = :source_id
        """), {"source_id": source_id}).fetchall()
        return result
    except Exception as e:
        return None

def get_files_by_sv_id(sv_id):
    try:
        result = db.session.execute(text("""
            SELECT sf.file_path, sf.nomenclature, sf.filetype
            FROM source_file sf 
            JOIN source_version_assembly sva ON sf.sva_id = sva.sva_id 
            WHERE sva.sv_id = :sv_id 
        """), {"sv_id": sv_id}).fetchall()
        return result
    except Exception as e:
        return None

def get_all_source_versions():
    """
    Returns all source versions with source names and feature types from the all_source_versions view.
    Returns a dictionary with success status and data or error message.
    """
    try:
        query = text("SELECT * FROM all_source_versions ORDER BY source_name, version_rank")
        res = db.session.execute(query)
        
        source_versions = []
        for row in res:
            # Convert comma-separated strings to lists
            gene_types = row.gene_types.split(',') if row.gene_types else []
            transcript_types = row.transcript_types.split(',') if row.transcript_types else []
            
            source_versions.append({
                "source_id": row.source_id,
                "source_name": row.source_name,
                "information": row.information,
                "link": row.link,
                "citation": row.citation,
                # Source version information
                "sv_id": row.sv_id,
                "version_name": row.version_name,
                "last_updated": row.last_updated,
                "version_rank": row.version_rank,
                # Assembly information
                "sva_id": row.sva_id,
                "assembly_id": row.assembly_id,
                "assembly_name": row.assembly_name,
                "assembly_information": row.assembly_information,
                # Organism information
                "taxonomy_id": row.taxonomy_id,
                "scientific_name": row.scientific_name,
                "common_name": row.common_name,
                "organism_information": row.organism_information,
                # File information
                "file_path": to_absolute_path(row.file_path) if row.file_path else None,
                "filetype": row.filetype,
                "nomenclature": row.nomenclature,
                "file_description": row.file_description,
                # Feature types
                "gene_types": gene_types,
                "transcript_types": transcript_types
            })
        
        return {"success": True, "data": source_versions}
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_latest_source_versions():
    """
    Returns the latest source versions with source names from the latest_source_versions view.
    Returns a dictionary with success status and data or error message.
    """
    try:
        query = text("SELECT * FROM latest_source_versions ORDER BY source_name")
        res = db.session.execute(query)
        
        source_versions = []
        for row in res:
            source_versions.append({
                "sv_id": row.sv_id,
                "source_name": row.source_name,
                "version": row.version_name,
                "information": row.information,
                "link": row.link,
                "last_updated": row.last_updated,
                "version_rank": row.version_rank,
                "source_id": row.source_id,
                "citation": row.citation,
                # Assembly information
                "sva_id": row.sva_id,
                "assembly_id": row.assembly_id,
                "assembly_name": row.assembly_name,
                "assembly_information": row.assembly_information,
                # Organism information
                "taxonomy_id": row.taxonomy_id,
                "scientific_name": row.scientific_name,
                "common_name": row.common_name,
                "organism_information": row.organism_information,
                # File information
                "file_path": to_absolute_path(row.file_path) if row.file_path else None,
                "filetype": row.filetype,
                "nomenclature": row.nomenclature,
                "file_description": row.file_description
            })
        
        return {"success": True, "data": source_versions}
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_source_file_by_extension(sva_id, nomenclature, file_type):
    """
    Get a source file path and metadata for a specific sva_id, nomenclature, and file type.
    Returns: {"file_path": directory_path, "file_name": filename, "friendly_file_name": friendly_file_name}
    """
    try:
        result = db.session.execute(text("""
            SELECT sf.file_path, a.assembly_name, s.name, sv.version_name
            FROM source_file sf
            JOIN source_version_assembly sva ON sf.sva_id = sva.sva_id
            JOIN assembly a ON sva.assembly_id = a.assembly_id
            JOIN source_version sv ON sva.sv_id = sv.sv_id
            JOIN source s ON sv.source_id = s.source_id
            WHERE sf.sva_id = :sva_id AND sf.nomenclature = :nomenclature AND sf.filetype = :filetype
        """), {
            "sva_id": sva_id,
            "nomenclature": nomenclature,
            "filetype": file_type
        }).fetchone()
        
        if not result:
            raise Exception(f"No file found for sva_id {sva_id} with nomenclature '{nomenclature}' and file type '{file_type}'")
        
        # Resolve relative path from DB to absolute path
        file_path = to_absolute_path(result.file_path)
        assembly_name = result.assembly_name
        source_name = result.name
        version_name = result.version_name
        
        # Split into directory and filename
        directory_path = os.path.dirname(file_path)
        file_name = os.path.basename(file_path)

        # assumes there are no other dots in the file name - relies on the DB and backend configuration for this
        file_extension = file_name.split(".",1)[-1]

        friendly_file_name = f"{source_name}_v{version_name}_{assembly_name}_{nomenclature}.{file_extension}"

        # Verify file exists
        if not os.path.exists(file_path):
            raise Exception(f"File not found at path: {file_path}")
        
        return {
            "file_path": directory_path,
            "file_name": file_name,
            "friendly_file_name": friendly_file_name
        }
    except Exception as e:
        raise Exception(f"Error retrieving file: {str(e)}")

def get_all_gene_types(sva_id: int=None):
    """
    Get all gene types for a specific sva_id or all sva_ids if sva_id is None.
    """
    try:
        query = "SELECT DISTINCT sva_id, type_value FROM gene"
        params = {}
        if sva_id:
            query += " WHERE sva_id = :sva_id"
            params = {"sva_id": sva_id}
        result = db.session.execute(text(query), params).fetchall()
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_all_transcript_types(sva_id: int=None):
    """
    Get all transcript types for a specific sva_id or all sva_ids if sva_id is None.
    """
    try:
        query = "SELECT DISTINCT sva_id, type_value FROM tx_dbxref"
        params = {}
        if sva_id:
            query += " WHERE sva_id = :sva_id"
            params = {"sva_id": sva_id}
        result = db.session.execute(text(query), params).fetchall()
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "message": str(e)}