from sqlalchemy import text
from db.db import db
from .queries import *
from .utils import *

def add_data_type(data_type, description):
    """
    Add a new data type.
    """
    try:
        if data_type_exists(data_type):
            return {
                "success": False,
                "message": "Data type already exists"
            }
        
        query = text("""
            INSERT INTO data_type (data_type, description)
            VALUES (:data_type, :description)
        """)
        result = db.session.execute(query, {
            'data_type': data_type,
            'description': description
        })
        return {
            "success": True,
            "message": "Data type added successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to add data type: {str(e)}"
        }

def edit_data_type(data_type, description):
    """
    Edit a data type.
    """
    try:
        if not data_type_exists(data_type):
            return {
                "success": False,
                "message": "Data type does not exist"
            }
        
        query = text("""
            UPDATE data_type
            SET description = :description
            WHERE data_type = :data_type
        """)
        result = db.session.execute(query, {
            'data_type': data_type,
            'description': description
        })
        return {
            "success": True,
            "message": "Data type updated successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to update data type: {str(e)}"
        }

def delete_data_type(data_type):
    """
    Delete a data type.
    """
    try:
        if not data_type_exists(data_type):
            return {
                "success": False,
                "message": "Data type does not exist"
            }
        
        query = text("""
            DELETE FROM data_type
            WHERE data_type = :data_type
        """)
        result = db.session.execute(query, {'data_type': data_type})
        return {
            "success": True,
            "message": "Data type deleted successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to delete data type: {str(e)}"
        }

def create_dataset(data):
    """
    Create a new dataset
    
    Args:
        data: Dictionary containing dataset data
            - name: Name of the dataset
            - description: Description of the dataset
            - data_type: Type of data in the dataset
            - sva_id: Source version assembly ID
            - file: TSV file with transcript data
    """
    try:
        # Insert the new dataset
        query = text("""
            INSERT INTO dataset (
                name, description, data_type
            ) VALUES (
                :name, :description, :data_type
            )
        """)
        
        result = db.session.execute(query, {
            'name': data['name'],
            'description': data['description'],
            'data_type': data.get('data_type', '')
        })
        
        dataset_id = result.lastrowid
        
        # Process transcript data (file upload is mandatory)
        if 'file' not in data or not data['sva_id']:
            return {
                "success": False,
                "message": "File upload and sva_id are required for dataset creation"
            }
        
        transcript_result = process_transcript_data(
            dataset_id, 
            data['sva_id'], 
            data['data_type'], 
            data['file']
        )
        if not transcript_result['success']:
            return transcript_result
        
        return {
            "success": True,
            "dataset_id": dataset_id,
            "message": "Dataset created successfully"
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to create dataset: {str(e)}"
        }

def update_dataset(dataset_id, data):
    """
    Update an existing dataset
    
    Args:
        dataset_id: ID of the dataset to update
        data: Dictionary containing updated dataset data
    """
    try:
        if not dataset_exists_by_id(dataset_id):
            return {
                "success": False,
                "message": "Dataset not found"
            }
        
        # Update the dataset
        query = text("""
            UPDATE dataset
            SET name = :name, description = :description, data_type = :data_type
            WHERE dataset_id = :dataset_id
        """)
        
        result = db.session.execute(query, {
            'name': data['name'],
            'description': data['description'],
            'data_type': data.get('data_type', ''),
            'dataset_id': dataset_id
        })

        return {
            "success": True,
            "message": "Dataset updated successfully"
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to update dataset: {str(e)}"
        }

def delete_dataset(dataset_id):
    """
    Delete a dataset
    
    Args:
        dataset_id: ID of the dataset to delete
    """
    try:
        # Delete the dataset
        query = text("""
            DELETE FROM dataset
            WHERE dataset_id = :dataset_id
        """)
        
        result = db.session.execute(query, {'dataset_id': dataset_id})
        
        return {
            "success": True,
            "message": "Dataset deleted successfully"
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to delete dataset: {str(e)}"
        }

def process_transcript_data(dataset_id, sva_id, data_type, file):
    """
    Process transcript data from TSV file and insert into database
    
    Args:
        dataset_id: ID of the dataset
        sva_id: Source version assembly ID
        data_type: Type of data
        file: TSV file object
    """
    try:
        # Read the TSV file
        content = file.read().decode('utf-8')
        
        if not content.strip():
            return {
                "success": False,
                "message": "TSV file is empty"
            }
        
        # Get transcript IDs from tx_dbxref for the given SVA
        query = text("""
            SELECT tid, transcript_id 
            FROM tx_dbxref 
            WHERE sva_id = :sva_id
        """)
        
        result = db.session.execute(query, {'sva_id': sva_id})
        transcript_map = {row.transcript_id: row.tid for row in result}
        
        # Process each line in the TSV file
        lines = content.strip().split('\n')
        processed_count = 0
        
        for line in lines:
            line = line.strip()
            if not line:  # Skip empty lines
                continue
            
            # Split by tab
            lcs = line.split('\t')
            if len(lcs) < 2:
                raise ValueError(f"Invalid line format: {line}")
            
            transcript_id = lcs[0].strip()
            data_value = lcs[1].strip()
            
            # Skip if transcript_id is not found in tx_dbxref
            if transcript_id not in transcript_map:
                print(f"Warning: Transcript ID not found: {transcript_id}. Skipping.")
                continue

            tid = transcript_map[transcript_id]
            
            # Insert transcript data
            insert_query = text("""
                INSERT INTO transcript_data (
                    tid, sva_id, transcript_id, dataset_id, data
                ) VALUES (
                    :tid, :sva_id, :transcript_id, :dataset_id, :data
                )
            """)
            
            result = db.session.execute(insert_query, {
                'tid': tid,
                'sva_id': sva_id,
                'transcript_id': transcript_id,
                'dataset_id': dataset_id,
                'data': data_value
            })
            if result.rowcount == 0:
                raise ValueError(f"Failed to insert transcript data for transcript_id: {transcript_id}")
            processed_count += 1
        
        return {
            "success": True,
            "message": f"Transcript data processed successfully. {processed_count} entries inserted."
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to process transcript data: {str(e)}"
        }