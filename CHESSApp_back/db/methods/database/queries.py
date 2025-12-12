from sqlalchemy import text
from db.db import db
from db.methods.utils import *

def get_database_config():
    """
    Returns the database configuration.
    {
        "data_dir": "path/to/data"
    }
    """
    res = db.session.execute(text("SELECT data_dir FROM database_configuration;")).fetchone()
    if not res or not res.data_dir:
        return {"data_dir": None}

    return {"data_dir": res.data_dir}

def list_tables():
    """
    Returns a list of only actual tables (excluding views) in the database.
    """
    result = db.session.execute(text("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_type = 'BASE TABLE'
    """)).fetchall()
    return [row[0] for row in result]

def list_views():
    """
    Returns a list of only views in the database.
    """
    result = db.session.execute(text("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_type = 'VIEW'
    """)).fetchall()
    return [row[0] for row in result]

def get_table_preview(table_name, limit=5, search_term=None):
    """
    Returns the schema (columns) and top rows for a given table.
    Converts bytes to base64 strings for JSON serialization.
    
    Args:
        table_name (str): Name of the table to preview
        limit (int): Maximum number of rows to return (default: 5)
        search_term (str, optional): Search term to filter results across all columns
    """
    columns_result = db.session.execute(text(f"DESCRIBE `{table_name}`;")).fetchall()
    columns = [row[0] for row in columns_result]
    
    # return rows matching search term where all columns are queried very simply
    if search_term and search_term.strip():
        search_conditions = []
        for column in columns:
            search_conditions.append(f"CAST(`{column}` AS CHAR) LIKE :search_term")
        
        where_clause = " OR ".join(search_conditions)
        query = f"SELECT * FROM `{table_name}` WHERE {where_clause} LIMIT {limit};"
        rows_result = db.session.execute(text(query), {"search_term": f"%{search_term}%"}).fetchall()
    else:
        query = f"SELECT * FROM `{table_name}` LIMIT {limit};"
        rows_result = db.session.execute(text(query)).fetchall()
    
    rows = [[serialize_sql_data(cell) for cell in row] for row in rows_result]
    return {"columns": columns, "rows": rows, "search_term": search_term}