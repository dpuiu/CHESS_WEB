from sqlalchemy import text
from db.db import db
from db.methods.genomes.queries import *
from db.methods.sources.queries import *

def validate_configuration_data(organism_id, assembly_id, nomenclature, source_id, sv_id, sequence_id, start_pos, end_pos):
    """
    Validate that all the foreign keys exist and are consistent
    """
    errors = []
    
    try:
        if not organism_exists(organism_id):
            return {
                "success": False,
                "message": f"Organism with ID {organism_id} does not exist"
            }
        if not assembly_exists(assembly_id):
            return {
                "success": False,
                "message": f"Assembly with ID {assembly_id} does not exist"
            }
        if not source_exists_by_id(source_id):
            return {
                "success": False,
                "message": f"Source with ID {source_id} does not exist"
            }

        if not source_version_exists_by_id(sv_id):
            return {
                "success": False,
                "message": f"Source version with ID {sv_id} does not exist"
            }
        if not source_version_assembly_exists_by_ids(sv_id, assembly_id):
            return {
                "success": False,
                "message": f"Source version assembly with ID {sv_id} and assembly {assembly_id} does not exist"
            }
        
        if not nomenclature_exists(nomenclature, assembly_id):
            return {
                "success": False,
                "message": f"Nomenclature '{nomenclature}' does not exist for assembly {assembly_id}"
            }
        
        if not sequence_id_exists(sequence_id, assembly_id, start_pos, end_pos):
            return {
                "success": False,
                "message": f"Sequence ID '{sequence_id}' with positions {start_pos}-{end_pos} does not exist for assembly {assembly_id}"
            }
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
        
    except Exception as e:
        return {
            'valid': False,
            'errors': [f"Validation error: {str(e)}"]
        }
