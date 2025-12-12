from sqlalchemy import text
from db.db import db
from db.methods.utils import *

def organism_exists(taxonomy_id: int):
    try:
        result = db.session.execute(text("""
            SELECT COUNT(*) FROM organism WHERE taxonomy_id = :taxonomy_id
        """), {"taxonomy_id": taxonomy_id}).fetchone()
        return result[0] > 0
    except Exception as e:
        return False

def assembly_exists(assembly_id: int):
    try:
        result = db.session.execute(text("""
            SELECT COUNT(*) FROM assembly WHERE assembly_id = :assembly_id
        """), {"assembly_id": assembly_id}).fetchone()
        return result[0] > 0
    except Exception as e:
        return False

def nomenclature_exists(nomenclature: str, assembly_id: int):
    try:
        result = db.session.execute(text("""
            SELECT COUNT(*) FROM nomenclature WHERE nomenclature = :nomenclature AND assembly_id = :assembly_id
        """), {"nomenclature": nomenclature, "assembly_id": assembly_id}).fetchone()
        return result[0] > 0
    except Exception as e:
        return False
    
def sequence_id_exists(sequence_id: str, assembly_id: int, start:None, end:None):
    # validate that the sequence ID exists in the assembly
    # and optionally that the start and end positions are valid
    try:
        result = db.session.execute(text("""
            SELECT length FROM sequence_id WHERE sequence_id = :sequence_id AND assembly_id = :assembly_id
        """), {"sequence_id": sequence_id, "assembly_id": assembly_id}).fetchone()
        
        if not result or len(result) == 0:
            return False
        
        seq_length = result[0]
        if start is not None and (start < 1 or start > seq_length):
            return False
        if end is not None and (end < 1 or end > seq_length):
            return False
        if start is not None and end is not None and start > end:
            return False
        return True
    
    except Exception as e:
        return False

def get_assembly(assembly_id: int):
    try:
        result = db.session.execute(text("""
            SELECT assembly_id, assembly_name, taxonomy_id FROM assembly WHERE assembly_id = :assembly_id
        """), {"assembly_id": assembly_id}).fetchone()
        return result
    except Exception as e:
        return None

# Organism management methods
def get_all_organisms():
    """
    Returns all organisms from the database.
    """
    try:
        result = db.session.execute(text("""
            SELECT taxonomy_id, scientific_name, common_name, information
            FROM organism
            ORDER BY scientific_name
        """)).fetchall()
        
        organisms = {}
        for row in result:
            organisms[row.taxonomy_id] = {
                "taxonomy_id": row.taxonomy_id,
                "scientific_name": row.scientific_name,
                "common_name": row.common_name,
                "information": row.information or ""
            }
        
        return {"success": True, "data": organisms}
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_all_assemblies():
    try:
        result = db.session.execute(text("""
            SELECT assembly_id, assembly_name, taxonomy_id, information
            FROM assembly
            ORDER BY assembly_name
        """)).fetchall()
        
        assemblies = {}
        for row in result:
            assemblies[row.assembly_id] = {
                "assembly_id": row.assembly_id,
                "assembly_name": row.assembly_name,
                "taxonomy_id": row.taxonomy_id,
                "information": row.information or ""
            }
        
        return {"success": True, "data": assemblies}
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_all_source_files(assembly_id: int, source_nomenclature: str, filetype: str=None):
    try:
        # Build the base query
        base_query = """
            SELECT file_path, sva_id, assembly_id, nomenclature, filetype, description
            FROM source_file
            WHERE assembly_id = :assembly_id AND nomenclature = :source_nomenclature
        """

        params = {
            "assembly_id": assembly_id,
            "source_nomenclature": source_nomenclature
        }

        # Add filetype condition only if specified
        if filetype is not None:
            base_query += " AND filetype = :filetype"
            params["filetype"] = filetype

        result = db.session.execute(text(base_query), params).fetchall()

        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_nomenclatures(assembly_id: int = None):
    """
    Returns all nomenclature mappings from the database.
    If assembly_id is provided, returns only mappings for that assembly.
    Output: {assembly_id: [row_dict, ...], ...}
    """
    try:
        query = """
            SELECT sim.assembly_id, 
                   sim.sequence_id, 
                   sim.nomenclature, 
                   sim.sequence_name, 
                   si.length 
            FROM sequence_id_map sim 
            LEFT JOIN sequence_id si 
                ON sim.assembly_id = si.assembly_id AND sim.sequence_id = si.sequence_id
        """
        params = {}
        if assembly_id:
            query += " WHERE sim.assembly_id = :assembly_id"
            params["assembly_id"] = assembly_id

        query += " ORDER BY sim.assembly_id, sim.nomenclature, sim.sequence_name"

        result = db.session.execute(text(query), params).fetchall()

        # Group rows by assembly_id
        data = {}
        for row in result:
            row_dict = {
                "assembly_id": row.assembly_id,
                "sequence_id": row.sequence_id,
                "nomenclature": row.nomenclature,
                "sequence_name": row.sequence_name,
                "length": row.length
            }
            if row.assembly_id not in data:
                data[row.assembly_id] = []
            data[row.assembly_id].append(row_dict)

        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": str(e)}
    
def get_nomenclature(assembly_id: int, nomenclature: str):
    """
    Get all sequence ID mappings for a specific assembly and nomenclature.
    Returns: [row_dict, ...]
    """
    try:
        result = db.session.execute(text("""
            SELECT sim.sequence_id, 
                   sim.sequence_name, 
                   si.length 
            FROM sequence_id_map sim 
            LEFT JOIN sequence_id si 
                ON sim.assembly_id = si.assembly_id AND sim.sequence_id = si.sequence_id
            WHERE sim.assembly_id = :assembly_id 
              AND sim.nomenclature = :nomenclature
            ORDER BY sim.sequence_name
        """), {
            "assembly_id": assembly_id,
            "nomenclature": nomenclature
        }).fetchall()

        data = []
        for row in result:
            row_dict = {
                "sequence_id": row.sequence_id,
                "sequence_name": row.sequence_name,
                "length": row.length
            }
            data.append(row_dict)

        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_map_between_nomenclatures(assembly_id: int, from_nomenclature: str, to_nomenclature: str):
    """
    Get mapping between two nomenclatures for a specific assembly.
    Returns: {from_sequence_name: to_sequence_name, ...}
    """
    try:
        result = db.session.execute(text("""
            SELECT sim_from.sequence_name AS from_sequence_name,
                   sim_to.sequence_name AS to_sequence_name
            FROM sequence_id_map sim_from
            JOIN sequence_id_map sim_to
              ON sim_from.assembly_id = sim_to.assembly_id
             AND sim_from.sequence_id = sim_to.sequence_id
            WHERE sim_from.assembly_id = :assembly_id
              AND sim_from.nomenclature = :from_nomenclature
              AND sim_to.nomenclature = :to_nomenclature
        """), {
            "assembly_id": assembly_id,
            "from_nomenclature": from_nomenclature,
            "to_nomenclature": to_nomenclature
        }).fetchall()
        mapping = {}
        for row in result:
            mapping[row.from_sequence_name] = row.to_sequence_name
        return {"success": True, "data": mapping}
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_genome_files():
    try:
        result = db.session.execute(text("""
            SELECT genome_file_id, assembly_id, nomenclature, file_path
            FROM genome_file
        """)).fetchall()

        genome_files = {}
        for row in result:
            genome_files[row.genome_file_id] = {
                "genome_file_id": row.genome_file_id,
                "assembly_id": row.assembly_id,
                "nomenclature": row.nomenclature,
                "file_path": row.file_path
            }
        
        return {"success": True, "data": genome_files}
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_fasta_file(assembly_id, nomenclature):
    """
    Get the FASTA file path and assembly metadata for a specific assembly and nomenclature.
    Returns: {"file_path": directory_path, "file_name": filename, "assembly_name": assembly_name}
    """
    try:
        # Query the genome_file and assembly tables for the specific assembly and nomenclature
        result = db.session.execute(text("""
            SELECT gf.file_path, a.assembly_name 
            FROM genome_file gf
            JOIN assembly a ON gf.assembly_id = a.assembly_id
            WHERE gf.assembly_id = :assembly_id AND gf.nomenclature = :nomenclature
        """), {
            "assembly_id": assembly_id,
            "nomenclature": nomenclature
        }).fetchone()
        
        if not result:
            raise Exception(f"No FASTA file found for assembly {assembly_id} with nomenclature '{nomenclature}'")
        
        file_path = result.file_path
        friendly_file_name = result.assembly_name + "_" + nomenclature + ".fasta"
        
        # Split into directory and filename
        directory_path = os.path.dirname(file_path)
        file_name = os.path.basename(file_path)
        
        # Verify file exists
        if not os.path.exists(file_path):
            raise Exception(f"FASTA file not found at path: {file_path}")
        
        return {
            "file_path": directory_path,
            "file_name": file_name,
            "friendly_file_name": friendly_file_name
        }
        
    except Exception as e:
        raise Exception(f"Error retrieving FASTA file: {str(e)}")

def get_fai_file(assembly_id, nomenclature):
    """
    Get the FAI (FASTA index) file path for a specific assembly and nomenclature.
    Returns: {"file_path": directory_path, "file_name": filename}
    """
    try:
        # Get the FASTA file path first
        fasta_info = get_fasta_file(assembly_id, nomenclature)

        friendly_file_name = fasta_info["friendly_file_name"] + ".fai"
        
        # FAI file has the same name as FASTA with .fai extension
        fasta_file_path = os.path.join(fasta_info["file_path"], fasta_info["file_name"])
        fai_file_path = fasta_file_path + ".fai"
        
        # Verify FAI file exists
        if not os.path.exists(fai_file_path):
            raise Exception(f"FAI index file not found at path: {fai_file_path}")
        
        directory_path = os.path.dirname(fai_file_path)
        file_name = os.path.basename(fai_file_path)
        
        return {
            "file_path": directory_path,
            "file_name": file_name,
            "friendly_file_name": friendly_file_name
        }
        
    except Exception as e:
        raise Exception(f"Error retrieving FAI file: {str(e)}")

def sequence_id_to_name(assembly_id, nomenclature, sequence_id):
    try:
        result = db.session.execute(text("""
            SELECT sequence_name FROM sequence_id_map WHERE assembly_id = :assembly_id AND nomenclature = :nomenclature AND sequence_id = :sequence_id
        """), {"assembly_id": assembly_id, "nomenclature": nomenclature, "sequence_id": sequence_id}).fetchone()
        return result[0]
    except Exception as e:
        return None