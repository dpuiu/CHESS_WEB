from sqlalchemy import text
from db.db import db
from .queries import *
from .utils import *

def create_configuration(data):
    """
    Create a new configuration
    
    Args:
        data: Dictionary containing configuration data
            - description: Description of the configuration
            - organism_id: ID of the organism
            - assembly_id: ID of the assembly
            - nomenclature: Nomenclature name
            - source_id: ID of the source
            - sv_id: ID of the source version
            - set_active: Whether to set this configuration as active
            - sequence_id: ID of the sequence
            - start: Start position
            - end: End position
    
    Returns:
        Dictionary with success status and configuration_id
    """
    try:
        # Validate the data
        validation = validate_configuration_data(
            data['organism_id'],
            data['assembly_id'],
            data['nomenclature'],
            data['source_id'],
            data['sv_id'],
            data['sequence_id'],
            data['start'],
            data['end']
        )
        
        if not validation['valid']:
            return {
                "success": False,
                "message": f"Validation failed: {', '.join(validation['errors'])}"
            }

        # Insert the new configuration
        query = text("""
            INSERT INTO configurations (
                active, description, organism_id, assembly_id, 
                nomenclature, source_id, sv_id, sequence_id, start, end
            ) VALUES (
                :active, :description, :organism_id, :assembly_id,
                :nomenclature, :source_id, :sv_id, :sequence_id, :start, :end
            )
        """)
        
        result = db.session.execute(query, {
            'active': 'active' if data.get('set_active', False) else None,
            'description': data['description'],
            'organism_id': data['organism_id'],
            'assembly_id': data['assembly_id'],
            'nomenclature': data['nomenclature'],
            'source_id': data['source_id'],
            'sv_id': data['sv_id'],
            'sequence_id': data['sequence_id'],
            'start': data['start'],
            'end': data['end']
        })

        configuration_id = result.lastrowid
        
        return {
            "success": True,
            "configuration_id": configuration_id,
            "message": "Configuration created successfully"
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to create configuration: {str(e)}"
        }

def update_configuration(configuration_id, data):
    """
    Update an existing configuration
    
    Args:
        configuration_id: ID of the configuration to update
        data: Dictionary containing updated configuration data
    
    Returns:
        Dictionary with success status
    """
    try:
        # Check if configuration exists
        existing_config = get_configuration_by_id(configuration_id)
        if not existing_config:
            return {
                "success": False,
                "message": f"Configuration with ID {configuration_id} does not exist"
            }
        
        # Build dynamic update query
        update_fields = []
        params = {'configuration_id': configuration_id}
        
        if 'description' in data:
            update_fields.append("description = :description")
            params['description'] = data['description']
        if 'organism_id' in data:
            update_fields.append("organism_id = :organism_id")
            params['organism_id'] = data['organism_id']
        if 'assembly_id' in data:
            update_fields.append("assembly_id = :assembly_id")
            params['assembly_id'] = data['assembly_id']
        if 'nomenclature' in data:
            update_fields.append("nomenclature = :nomenclature")
            params['nomenclature'] = data['nomenclature']
        if 'source_id' in data:
            update_fields.append("source_id = :source_id")
            params['source_id'] = data['source_id']
        if 'sv_id' in data:
            update_fields.append("sv_id = :sv_id")
            params['sv_id'] = data['sv_id']
        if 'set_active' in data:
            update_fields.append("active = :active")
            params['active'] = 'active' if data['set_active'] else None
        if 'sequence_id' in data:
            update_fields.append("sequence_id = :sequence_id")
            params['sequence_id'] = data['sequence_id']
        if 'start' in data:
            update_fields.append("start = :start")
            params['start'] = data['start']
        if 'end' in data:
            update_fields.append("end = :end")
            params['end'] = data['end']
        
        if not update_fields:
            return {
                "success": True,
                "message": "No changes to update"
            }
        
        # If updating foreign keys, validate the new data
        if any(key in data for key in ['organism_id', 'assembly_id', 'nomenclature', 'source_id', 'sv_id', 'sequence_id', 'start', 'end']):
            validation = validate_configuration_data(
                data.get('organism_id', existing_config['organism_id']),
                data.get('assembly_id', existing_config['assembly_id']),
                data.get('nomenclature', existing_config['nomenclature']),
                data.get('source_id', existing_config['source_id']),
                data.get('sv_id', existing_config['sv_id']),
                data.get('sequence_id', existing_config['sequence_id']),
                data.get('start', existing_config['start']),
                data.get('end', existing_config['end'])
            )
            
            if not validation['valid']:
                return {
                    "success": False,
                    "message": f"Validation failed: {', '.join(validation['errors'])}"
                }
        
        query = text(f"""
            UPDATE configurations 
            SET {', '.join(update_fields)}
            WHERE configuration_id = :configuration_id
        """)
        
        result = db.session.execute(query, params)
        
        if result.rowcount > 0:
            return {
                "success": True,
                "message": "Configuration updated successfully"
            }
        else:
            return {
                "success": False,
                "message": "No configuration was updated"
            }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to update configuration: {str(e)}"
        }

def delete_configuration(configuration_id):
    """
    Delete a configuration
    
    Args:
        configuration_id: ID of the configuration to delete
    
    Returns:
        Dictionary with success status
    """
    try:
        # Check if configuration exists
        existing_config = get_configuration_by_id(configuration_id)
        if not existing_config:
            return {
                "success": False,
                "message": f"Configuration with ID {configuration_id} does not exist"
            }
        
        query = text("""
            DELETE FROM configurations 
            WHERE configuration_id = :configuration_id
        """)
        
        result = db.session.execute(query, {'configuration_id': configuration_id})
        
        if result.rowcount > 0:
            return {
                "success": True,
                "message": "Configuration deleted successfully"
            }
        else:
            return {
                "success": False,
                "message": "No configuration was deleted"
            }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to delete configuration: {str(e)}"
        }

def set_active_configuration(configuration_id):
    """
    Set a configuration as active (deactivates all others)
    
    Args:
        configuration_id: ID of the configuration to activate
    
    Returns:
        Dictionary with success status
    """
    try:
        # Check if configuration exists
        existing_config = get_configuration_by_id(configuration_id)
        if not existing_config:
            return {
                "success": False,
                "message": f"Configuration with ID {configuration_id} does not exist"
            }
        
        # First set all configurations to NULL
        deactivate_query = text("UPDATE configurations SET active = NULL")
        db.session.execute(deactivate_query)
        
        # Then set the specified configuration to 'active'
        query = text("""
            UPDATE configurations 
            SET active = 'active'
            WHERE configuration_id = :configuration_id
        """)
        
        result = db.session.execute(query, {'configuration_id': configuration_id})
        
        if result.rowcount > 0:
            return {
                "success": True,
                "message": "Configuration activated successfully"
            }
        else:
            return {
                "success": False,
                "message": "Failed to activate configuration"
            }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to set active configuration: {str(e)}"
        }