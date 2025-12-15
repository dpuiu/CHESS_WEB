import os
import subprocess
from db.db import db
from sqlalchemy import text
from pyfaidx import Fasta, Sequence
from Bio.Seq import Seq

def extract_pdb_metadata(pdb_content):
    """Extract basic metadata from PDB file content"""
    lines = pdb_content.split('\n')
    metadata = {}
    
    for line in lines:
        if line.startswith('TITLE'):
            metadata['title'] = line[10:].strip()
        elif line.startswith('REMARK   2 RESOLUTION'):
            try:
                metadata['resolution'] = float(line.split()[-1])
            except:
                pass
        elif line.startswith('ATOM') or line.startswith('HETATM'):
            # Count atoms
            metadata['atoms'] = metadata.get('atoms', 0) + 1
        elif line.startswith('TER') or line.startswith('END'):
            break
    
    return metadata

def get_fasta_file_for_tid(tid):
    """
    Get the fasta file path for a given tid
    Returns the file path to the genome fasta file for the assembly containing this transcript
    """
    try:
        # Join transcript -> sequence_id -> assembly -> genome_file to get fasta path
        result = db.session.execute(text("""
            SELECT 
                gf.file_path,
                gf.nomenclature,
                a.assembly_name,
                a.assembly_id,
                t.sequence_id
            FROM transcript t
            JOIN sequence_id si ON t.sequence_id = si.sequence_id
            JOIN assembly a ON si.assembly_id = a.assembly_id
            JOIN genome_file gf ON a.assembly_id = gf.assembly_id
            WHERE t.tid = :tid
            LIMIT 1
        """), {"tid": tid}).fetchone()
        
        if not result:
            return {"success": False, "message": "No fasta file found for transcript"}
        
        # Try to access the result safely
        try:
            # First try attribute access (SQLAlchemy Row objects)
            if hasattr(result, 'file_path'):
                return {
                    "success": True,
                    "file_path": result.file_path,
                    "nomenclature": result.nomenclature,
                    "assembly_name": result.assembly_name,
                    "assembly_id": result.assembly_id,
                    "sequence_id": result.sequence_id
                }
            else:
                # Fallback to index-based access
                return {
                    "success": True,
                    "file_path": result[0],
                    "nomenclature": result[1],
                    "assembly_name": result[2],
                    "assembly_id": result[3],
                    "sequence_id": result[4]
                }
        except (AttributeError, IndexError) as access_err:
            # Last resort: try to convert to dict if possible
            if hasattr(result, '_asdict'):
                result_dict = result._asdict()
                return {
                    "success": True,
                    "file_path": result_dict.get('file_path'),
                    "nomenclature": result_dict.get('nomenclature'),
                    "assembly_name": result_dict.get('assembly_name'),
                    "assembly_id": result_dict.get('assembly_id'),
                    "sequence_id": result_dict.get('sequence_id')
                }
            else:
                raise Exception(f"Cannot access result data: {access_err}")
        
    except Exception as e:
        return {"success": False, "message": f"Failed to get fasta file: {str(e)}"}

def extract_transcript_sequence(fasta_file_path, sequence_name, exons, strand):
    """
    Extract the nucleotide sequence for a transcript from the genome fasta file using pyfaidx.
    """
    try:
        if not os.path.exists(fasta_file_path):
            return {"success": False, "message": "FASTA file not accessible"}
        
        # Open the FASTA file with pyfaidx
        fasta = Fasta(fasta_file_path)
            
        transcript_seq = ""
        for exon_start, exon_end in exons:
            try:
                # pyfaidx uses 1-based coordinates by default, which matches your database
                # But we need to be careful about the end coordinate (inclusive vs exclusive)
                exon_seq = fasta[sequence_name][exon_start-1:exon_end]  # +1 because pyfaidx end is exclusive
                transcript_seq += str(exon_seq)
            except Exception as e:
                return {"success": False, "message": f"Failed to get nucleotide sequence: {str(e)}"}

        # Apply reverse complement if on negative strand
        if strand == 0:  # negative strand
            # Use pyfaidx's built-in reverse complement
            transcript_seq = str(Sequence(transcript_seq).reverse.complement)

        # Close the fasta file to free resources
        fasta.close()
        
        return transcript_seq.upper()
        
    except Exception as e:
        return {"success": False, "message": f"Failed to get nucleotide sequence: {str(e)}"}

def translate_sequence(sequence):
    """
    Translate a nucleotide sequence to an amino acid sequence using the standard genetic code.
    """
    try:
        aa_sequence = str(Seq(sequence).translate())
        return aa_sequence
    except Exception as e:
        return None

def cut(chain: list, start: int, end: int) -> list:
    """
    This function cuts a chain of intervals to a specified start and end position.
    If the cut range is completely outside the chain, returns an empty list.
    
    Parameters:
    chain (list): A chain of intervals [(start1, end1), (start2, end2), ...].
    start (int): The start position to cut to.
    end (int): The end position to cut to.
    
    Returns:
    list: A chain cut to the specified start and end position.
          Returns empty list if cut range is outside all intervals.
    """
    if not chain or start >= end:
        return []
    
    res = []
    for cs, ce in chain:
        if ce < start or cs > end:
            continue
            
        new_cs = max(cs, start)
        new_ce = min(ce, end)
        
        if new_cs <= new_ce:
            res.append((new_cs, new_ce))
    
    return res