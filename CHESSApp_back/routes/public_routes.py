# Public-facing API routes for the CHESS Web App

import os
import smtplib
import tempfile
import zipfile
import threading
import uuid
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from timeit import main
from flask import Blueprint, jsonify, request, send_from_directory, Response
from sqlalchemy import text
from db.methods import *
from db.db import db

public_bp = Blueprint('public', __name__)

@public_bp.route('/globalData', methods=['GET'])
def global_data():
    """
    Fetches comprehensive data about the database for UI building
    Returns: JSON object with organisms, assemblies (including nomenclatures), sources
    """
    
    sources = get_all_source_versions()  # Now includes feature types
    organisms = get_all_organisms()
    assemblies = get_all_assemblies()
    nomenclatures = get_nomenclatures()
    genome_files = get_genome_files()
    configurations = get_all_configurations()
    data_types = get_all_data_types()
    datasets = get_all_datasets()

    if not organisms["success"] or not assemblies["success"] or not sources["success"] or not nomenclatures["success"] or not genome_files["success"] or not datasets["success"]:
        return jsonify({"error": "Failed to fetch organisms, assemblies, sources, nomenclatures, genome files, or datasets"}), 500
    
    sources = organize_all_source_versions(sources["data"])
    nomenclatures = organize_nomenclatures(nomenclatures["data"])

    # Add nomenclature data to assemblies
    for assembly_id in assemblies["data"]:
        assemblies["data"][assembly_id]["nomenclatures"] = nomenclatures[assembly_id]["nomenclatures"] if assembly_id in nomenclatures else []
        assemblies["data"][assembly_id]["sequence_name_mappings"] = nomenclatures[assembly_id]["sequence_name_mappings"] if assembly_id in nomenclatures else {}
        assemblies["data"][assembly_id]["sequence_id_mappings"] = nomenclatures[assembly_id]["sequence_id_mappings"] if assembly_id in nomenclatures else {}

    for assembly_id in assemblies["data"]:
        assemblies["data"][assembly_id]["genome_files"] = []

    # Add genome files to assemblies
    for genome_file_id, genome_file_data in genome_files["data"].items():
        assembly_id = genome_file_data["assembly_id"]
        nomenclature = genome_file_data["nomenclature"]
        file_path = genome_file_data["file_path"]
        if assembly_id in assemblies["data"]:
            assemblies["data"][assembly_id]["genome_files"].append({
                "genome_file_id": genome_file_data["genome_file_id"],
                "nomenclature": nomenclature,
                "file_path": file_path
            })

    data = {
        "organisms": organisms["data"],
        "assemblies": assemblies["data"],
        "sources": sources,
        "configurations": configurations,
        "datasets": {"data_types": data_types["data"], 
                     "datasets": datasets["data"] if isinstance(datasets, dict) and "data" in datasets else datasets}
    }

    return jsonify(data)

@public_bp.route('/organisms', methods=['GET'])
def get_organisms():
    """
    Returns all organisms from the database.
    """
    try:
        result = get_all_organisms()
        if result["success"]:
            return jsonify(result)
        else:
            return jsonify(result), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to fetch organisms: {str(e)}"}), 500

@public_bp.route('/assemblies', methods=['GET'])
def get_assemblies():
    """
    Returns all assemblies from the database.
    """
    try:
        result = get_all_assemblies()
        if result["success"]:
            return jsonify(result)
        else:
            return jsonify(result), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to fetch assemblies: {str(e)}"}), 500

@public_bp.route('/assemblies/<int:assembly_id>/nomenclatures', methods=['GET'])
def get_assembly_nomenclatures(assembly_id):
    """
    Gets all nomenclatures for a specific assembly.
    """
    try:
        if not assembly_exists(assembly_id):
            return jsonify({"success": False, "message": "Assembly not found"}), 404
        
        # Get nomenclatures for this assembly
        nomenclatures = db.session.execute(text("""
            SELECT DISTINCT nomenclature
            FROM sequence_id_map
            WHERE assembly_id = :assembly_id
            ORDER BY nomenclature
        """), {"assembly_id": assembly_id}).fetchall()
        
        nomenclature_list = [n.nomenclature for n in nomenclatures]
        return jsonify({"success": True, "data": nomenclature_list})
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to get nomenclatures: {str(e)}"}), 500

# ============================================================================
# CONFIGURATIONS ROUTES
# ============================================================================

@public_bp.route('/configurations', methods=['GET'])
def get_configurations():
    """
    Get all configurations
    """
    try:
        configurations = get_all_configurations()
        return jsonify({
            "success": True,
            "configurations": configurations
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to get configurations: {str(e)}"}), 500

@public_bp.route('/fasta/<int:assembly_id>/<string:nomenclature>', methods=['GET'])
def get_fasta(assembly_id, nomenclature):
    """
    Get the fasta file for a specific organism, assembly, source, version, and nomenclature.
    Uses conditional=True to properly handle Range requests for indexed FASTA access.
    """
    try:
        fasta_file_result = get_fasta_file(assembly_id, nomenclature)
        
        response = send_from_directory(
            fasta_file_result["file_path"],
            fasta_file_result["file_name"],
            as_attachment=True,
            download_name=fasta_file_result["friendly_file_name"],
            mimetype='text/plain',
            conditional=True  # Enable Range requests for JBrowse
        )
        
        # Add CORS headers for JBrowse
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Range'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Range, Content-Length, Accept-Ranges'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        
        return response
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to get fasta file: {str(e)}"}), 500

@public_bp.route('/fai/<int:assembly_id>/<string:nomenclature>', methods=['GET'])
def get_fai(assembly_id, nomenclature):
    """
    Get the fai file for a specific organism, assembly, source, version, and nomenclature
    """
    try:
        fai_file_result = get_fai_file(assembly_id, nomenclature)
        
        response = send_from_directory(
            fai_file_result["file_path"],
            fai_file_result["file_name"],
            as_attachment=True,
            download_name=fai_file_result["friendly_file_name"],
            mimetype='text/plain',
            conditional=True
        )
        
        # Add CORS headers for JBrowse
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Range, Content-Length, Accept-Ranges'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        
        return response
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to get fai file: {str(e)}"}), 500

@public_bp.route('/gff3bgz_jbrowse2/<int:sva_id>/<string:nomenclature>', methods=['GET'])
def get_gff3bgz_jbrowse2(sva_id, nomenclature):
    """
    Get the gff3bgz file for a specific organism, assembly, source, version, and nomenclature.
    Uses send_from_directory to properly handle Range requests for bgzip random access.
    """
    try:
        gff3bgz_file = get_source_file_by_extension(sva_id, nomenclature, "sorted_gff_bgz")
        
        # Use send_from_directory which properly handles:
        # - HTTP Range requests (required for bgzip/tabix random access)
        # - ETags and conditional requests
        # - Proper streaming for large files
        response = send_from_directory(
            gff3bgz_file["file_path"],
            gff3bgz_file["file_name"],
            mimetype='application/octet-stream',
            conditional=True  # Enable conditional responses (ETags, Range requests)
        )
        
        # Add CORS headers for JBrowse
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Range'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Range, Content-Length, Accept-Ranges'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        
        return response
            
    except Exception as e:
        print(f"ERROR: Failed to get gff3bgz file: {str(e)}")
        return jsonify({"success": False, "message": f"Failed to get gff3bgz file: {str(e)}"}), 500

@public_bp.route('/gff3bgztbi/<int:sva_id>/<string:nomenclature>', methods=['GET'])
def get_gff3bgztbi(sva_id, nomenclature):
    """
    Get the gff3bgztbi (tabix index) file for a specific organism, assembly, source, version, and nomenclature.
    """
    try:
        gff3bgztbi_file = get_source_file_by_extension(sva_id, nomenclature, "sorted_gff_bgz_tbi")
        
        response = send_from_directory(
            gff3bgztbi_file["file_path"],
            gff3bgztbi_file["file_name"],
            mimetype='application/octet-stream',
            conditional=True
        )
        
        # Add CORS headers for JBrowse
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Range, Content-Length, Accept-Ranges'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        
        return response
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to get gff3bgztbi file: {str(e)}"}), 500

@public_bp.route('/source_file/<int:sva_id>/<string:nomenclature>/<string:file_type>', methods=['GET'])
def get_source_file(sva_id, nomenclature, file_type):
    """
    Get a file for a specific organism, assembly, source, version, and nomenclature
    """
    try:
        source_file = get_source_file_by_extension(sva_id, nomenclature, file_type)

        return send_from_directory(
            source_file["file_path"],
            source_file["file_name"],
            as_attachment=True,
            download_name=source_file["friendly_file_name"],  # Custom filename from source_file
            max_age=3600  # Cache control
        )
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to get source file: {str(e)}"}), 500

@public_bp.route('/pdb/<int:td_id>', methods=['GET'])
def pdb_file_for_3dmoljs(td_id):
    """
    Retrieves PDB file content and metadata for a specific transcript data entry
    """
    try:
        # Get PDB file info
        source_file = get_pdb_file(td_id)
        
        # Read PDB file content
        pdb_path = os.path.join(source_file["file_path"], source_file["file_name"])
        
        with open(pdb_path, 'r') as f:
            pdb_content = f.read()
        
        # Extract basic metadata from PDB content
        structure_info = extract_pdb_metadata(pdb_content)
        
        response_data = {
            "td_id": td_id,
            "pdb_content": pdb_content,
            "filename": source_file["file_name"],
            "structure_info": structure_info
        }
        
        return jsonify({
            "success": True,
            "data": response_data
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False, 
            "message": f"Failed to get PDB file: {str(e)}"
        }), 500

@public_bp.route('/pdb_download/<int:td_id>', methods=['GET'])
def pdb_download(td_id):
    """
    Downloads the PDB file for a specific transcript data entry
    """
    try:
        source_file = get_pdb_file(td_id)

        print("source_file", source_file)

        return send_from_directory(
            source_file["file_path"],
            source_file["file_name"],
            download_name=source_file["file_name"],
            as_attachment=True,
            max_age=3600  # Cache control
        )
    except Exception as e:
        return jsonify({
            "success": False, 
            "message": f"Failed to get PDB file: {str(e)}"
        }), 500

@public_bp.route('/genes/search', methods=['GET'])
def search_genes():
    """
    Search genes with backend pagination and real-time filtering.
    """
    try:
        # Required parameter
        sva_id = request.args.get('sva_id', type=int)
        if not sva_id:
            return jsonify({"success": False, "message": "sva_id parameter is required"}), 400
        
        # Optional parameters
        search_term = request.args.get('q', '').strip()
        gene_type = request.args.get('gene_type', '').strip() or None
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 25, type=int), 100)
        sort_by = request.args.get('sort', 'name')
        sort_order = request.args.get('order', 'asc')
        
        result = search_genes_paginated(sva_id, search_term, gene_type, page, per_page, sort_by, sort_order)
        return jsonify(result), 200 if result["success"] else 500
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to search genes: {str(e)}"}), 500

@public_bp.route('/gene/<int:gid>', methods=['GET'])
def get_gene_by_gid(gid):
    """
    Get a gene by its gid with complete transcript information
    {
        "success": true,
        "data": {
            "gid": 12345,
            "sva_id": 1,
            "gene_id": "ENSG00000012048",
            "name": "BRCA1",
            "gene_type": "protein_coding",
            "transcripts": [
            {
                "tid": 67890,
                "transcript_id": "ENST00000357654",
                "transcript_type": "protein_coding",
                "sequence_id": 17,
                "strand": false,
                "coordinates": {
                "start": 43044295,
                "end": 43170245
                },
                "exons": [(43044295, 43045802), (43047643, 43049194)],
                "cds": [(43044295, 43045802), (43047643, 43049194)]
                ],
                "datasets": [
                {
                    "dataset_id": 1,
                    "dataset_name": "Expression Data",
                    "dataset_description": "RNA-seq expression levels",
                    "data_type": "expression",
                    "data_entries": [
                    {
                        "td_id": 1001,
                        "data": "15.7"
                    }
                    ]
                }
                ]
            }
            ]
        }
        }
    """
    try:
        result = get_full_gene_data(gid)
        return jsonify(result), 200 if result["success"] else 404
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to fetch gene data: {str(e)}"}), 500

@public_bp.route('/transcript_data', methods=['GET'])
def get_transcript_data():
    """
    Get full transcript data by tid and transcript_id
    results example:
    {
        "success": true,
        "data": {
            "tid": 12345,
            "transcript_id": "CHS.1000.1",
            "transcript_type": "protein_coding",
            "sequence_id": 17,
            "strand": false,
            "coordinates": {
                "start": 43044295,
                "end": 43170245
            },
            "exons": [(43044295, 43045802), (43047643, 43049194)],
            "cds": [(43044295, 43045802), (43047643, 43049194)],
            "nt_sequence": "GATTACA",
            "datasets": [
                {
                    "dataset_id": 1,
                    "dataset_name": "Expression Data",
                    "dataset_description": "RNA-seq expression levels",
                    "data_type": "expression",
                    "data_entries": [
                        {
                            "td_id": 1001,
                            "data": "15.7"
                        }
                    ]
                }
            ],
            "attributes": {
                "gene_id": "ENSG00000012048",
                "gene_name": "BRCA1",
                "gene_type": "protein_coding",
                "transcript_type": "protein_coding",
                "sequence_id": 17,
            }
    }
    """
    try:
        tid = request.args.get('tid', type=int)
        transcript_id = request.args.get('transcript_id', type=str)
        assembly_id = request.args.get('assembly_id', type=int)
        nomenclature = request.args.get('nomenclature', type=str)

        if not tid or not transcript_id or not assembly_id or not nomenclature:
            return jsonify({"success": False, "message": "Missing required arguments: tid, transcript_id, assembly_id, and nomenclature"}), 400

        result = get_full_transcript_data(tid, transcript_id, assembly_id, nomenclature)
        return jsonify(result), 200 if result["success"] else 404
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to fetch transcript data: {str(e)}"}), 500

@public_bp.route('/data_types', methods=['GET'])
def get_data_types():
    """
    Get all data types.
    """
    try:
        result = get_all_data_types()
        if result["success"]:
            return jsonify(result)
        else:
            return jsonify(result), 400
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to get data types: {str(e)}"}), 500