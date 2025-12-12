from sqlalchemy import text
from db.db import db

def get_all_configurations():
    """
    Get all configurations with related data
    """
    try:
        query = text("""
            SELECT 
                c.configuration_id,
                c.active,
                c.description,
                c.organism_id,
                c.assembly_id,
                c.nomenclature,
                c.source_id,
                c.sv_id
            FROM configurations c
            ORDER BY c.active DESC, c.configuration_id DESC
        """)
        
        result = db.session.execute(query)
        configurations = []
        
        for row in result:
            config = {
                'configuration_id': row.configuration_id,
                'active': row.active == 'active',
                'description': row.description,
                'organism_id': row.organism_id,
                'assembly_id': row.assembly_id,
                'nomenclature': row.nomenclature,
                'source_id': row.source_id,
                'sv_id': row.sv_id,
            }
            configurations.append(config)
        
        return configurations
        
    except Exception as e:
        return []

def get_configuration_by_id(configuration_id):
    """
    Get a specific configuration by ID
    """
    try:
        query = text("""
            SELECT 
                c.configuration_id,
                c.active,
                c.description,
                c.organism_id,
                c.assembly_id,
                c.nomenclature,
                c.source_id,
                c.sv_id,
                c.sequence_id,
                c.start,
                c.end
            FROM configurations c
            WHERE c.configuration_id = :configuration_id
        """)
        
        result = db.session.execute(query, {'configuration_id': configuration_id})
        row = result.fetchone()
        
        if row:
            return {
                'configuration_id': row.configuration_id,
                'active': row.active == 'active',
                'description': row.description,
                'organism_id': row.organism_id,
                'assembly_id': row.assembly_id,
                'nomenclature': row.nomenclature,
                'source_id': row.source_id,
                'sv_id': row.sv_id,
                'sequence_id': row.sequence_id,
                'start': row.start,
                'end': row.end
            }
        
        return None
        
    except Exception as e:
        return None
