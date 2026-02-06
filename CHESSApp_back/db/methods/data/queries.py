from sqlalchemy import text
from db.db import db, to_absolute_path
from db.methods.utils import *
from db.methods.data.utils import *
from db.methods.genomes.queries import get_fasta_file, sequence_id_to_name

def search_genes_paginated(sva_id, search_term=None, gene_type=None, page=1, per_page=25, sort_by='name', sort_order='asc'):
    try:
        # Validate sort parameters
        valid_sorts = {
            'name': 'g.name', 
            'gene_id': 'g.gene_id', 
            'transcript_count': 'transcript_count', 
            'type': 'g.type_value',
            'start': 'gene_start',
            'end': 'gene_end',
            'sequence_id': 'sequence_id'
        }
        sort_column = valid_sorts.get(sort_by, 'g.name')
        order = 'DESC' if sort_order.lower() == 'desc' else 'ASC'
        
        # Base conditions
        where_conditions = ["g.sva_id = :sva_id"]
        params = {"sva_id": sva_id}
        
        # Add search filtering
        if search_term:
            where_conditions.append("""(
                g.name LIKE :search_term OR 
                g.gene_id LIKE :search_term OR 
                g.type_value LIKE :search_term OR
                g.type_key LIKE :search_term
            )""")
            params["search_term"] = f"%{search_term}%"
        
        # Add gene type filtering
        if gene_type:
            where_conditions.append("g.type_value = :gene_type")
            params["gene_type"] = gene_type
        
        where_clause = "WHERE " + " AND ".join(where_conditions)
        
        # Count query for pagination info
        count_query = f"""
            SELECT COUNT(DISTINCT g.gid) as total_count
            FROM gene g
            {where_clause}
        """
        
        # Main query with coordinates
        main_query = f"""
            SELECT 
                g.gid,
                g.sva_id,
                g.name,
                g.type_key,
                g.type_value,
                g.gene_id,
                COUNT(DISTINCT txd.tid) as transcript_count,
                -- Gene coordinates based on min/max transcript positions
                MIN(t.start) as gene_start,
                MAX(t.end) as gene_end,
                -- Include sequence_id and strand from the first transcript
                MIN(t.sequence_id) as sequence_id,
                MIN(t.strand) as strand
            FROM gene g
            LEFT JOIN tx_dbxref txd ON g.sva_id = txd.sva_id AND g.gid = txd.gid
            LEFT JOIN transcript t ON txd.tid = t.tid
            {where_clause}
            GROUP BY g.gid, g.sva_id, g.name, g.type_key, g.type_value, g.gene_id
            ORDER BY {sort_column} {order}, g.gid
            LIMIT :per_page OFFSET :offset
        """
        
        # Execute count query
        total_count = db.session.execute(text(count_query), params).scalar() or 0
        
        # Execute main query
        offset = (page - 1) * per_page
        params.update({"per_page": per_page, "offset": offset})
        
        result = db.session.execute(text(main_query), params).fetchall()
        
        # Format results
        genes = []
        for row in result:
            gene_data = {
                "gid": row.gid,
                "sva_id": row.sva_id,
                "name": row.name,
                "type_key": row.type_key,
                "type_value": row.type_value,
                "gene_id": row.gene_id,
                "transcript_count": row.transcript_count,
                # Coordinate information
                "coordinates": {
                    "sequence_id": row.sequence_id,
                    "start": row.gene_start,
                    "end": row.gene_end,
                    "strand": bool(row.strand) if row.strand is not None else None
                }
            }
            genes.append(gene_data)
        
        # Calculate pagination metadata
        total_pages = (total_count + per_page - 1) // per_page if total_count > 0 else 1
        
        return {
            "success": True,
            "data": genes,
            "pagination": {
                "current_page": page,
                "per_page": per_page,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            },
            "filters": {
                "search_term": search_term,
                "sva_id": sva_id,
                "gene_type": gene_type,
                "sort_by": sort_by,
                "sort_order": sort_order
            }
        }
        
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_full_gene_data(gid):
    """
    Fetch complete gene data including all transcripts with exons, CDS, and transcript data
    """
    try:
        # First, get the gene information
        gene_query = """
            SELECT 
                g.gid,
                g.sva_id,
                g.gene_id,
                g.name,
                g.type_value as gene_type
            FROM gene g
            WHERE g.gid = :gid
        """
        
        gene_result = db.session.execute(text(gene_query), {"gid": gid}).fetchone()
        
        if not gene_result:
            return {"success": False, "message": "Gene not found"}
        
        # Get all transcripts for this gene
        transcripts_query = """
            SELECT DISTINCT
                t.tid,
                txd.transcript_id,
                txd.type_value as transcript_type,
                t.sequence_id,
                t.strand,
                txd.start as transcript_start,
                txd.end as transcript_end,
                txd.cds_start,
                txd.cds_end
            FROM tx_dbxref txd
            JOIN transcript t ON txd.tid = t.tid
            WHERE txd.gid = :gid AND txd.sva_id = :sva_id
            ORDER BY txd.transcript_id
        """
        
        transcripts_result = db.session.execute(text(transcripts_query), {
            "gid": gid,
            "sva_id": gene_result.sva_id
        }).fetchall()
        
        # Build the response
        gene_data = {
            "gid": gene_result.gid,
            "sva_id": gene_result.sva_id,
            "gene_id": gene_result.gene_id,
            "name": gene_result.name,
            "gene_type": gene_result.gene_type,
            "transcripts": []
        }
        
        # Process each transcript
        for transcript in transcripts_result:
            transcript_data = {
                "tid": transcript.tid,
                "transcript_id": transcript.transcript_id,
                "transcript_type": transcript.transcript_type,
                "sequence_id": transcript.sequence_id,
                "strand": bool(transcript.strand) if transcript.strand is not None else None,
                "coordinates": {
                    "start": transcript.transcript_start,
                    "end": transcript.transcript_end
                }
            }
            
            # Get exon coordinates for this transcript
            exon_coords = get_exon_chain(transcript.tid)
            exon_coords = cut(exon_coords, transcript.transcript_start, transcript.transcript_end)
            transcript_data["exons"] = exon_coords
            
            # Get CDS coordinates for this transcript (if it has CDS)
            if transcript.cds_start is not None and transcript.cds_end is not None:
                cds_coords = get_exon_chain(transcript.tid)
                cds_coords = cut(cds_coords, transcript.cds_start, transcript.cds_end)
                transcript_data["cds"] = cds_coords
            else:
                transcript_data["cds"] = []
            
            # Get transcript data organized by dataset
            transcript_datasets = get_transcript_data_by_dataset(transcript.tid)
            transcript_data["datasets"] = transcript_datasets
            
            gene_data["transcripts"].append(transcript_data)
        
        return {"success": True, "data": gene_data}
        
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_exon_chain(tid):
    """
    Calculate a coordinate chain (e.g., exon segments) for a transcript between start and end.
    The result is always bound within [start, end], regardless of transcript or CDS boundaries.
    """
    try:
        transcript_query = """
            SELECT start, end
            FROM transcript
            WHERE tid = :tid
        """
        transcript = db.session.execute(text(transcript_query), {"tid": tid}).fetchone()
        if not transcript:
            return {"success": False, "message": "Transcript not found"}

        start = transcript.start
        end = transcript.end

        introns_query = """
            SELECT start, end
            FROM intron
            JOIN transcript_intron ti ON intron.iid = ti.iid
            WHERE ti.tid = :tid
            ORDER BY start
        """
        introns = db.session.execute(text(introns_query), {"tid": tid}).fetchall()

        coords = [[start, None]]

        if introns:
            for intron in introns:
                intron_start = intron.start
                intron_end = intron.end

                coords[-1][1] = intron_start
                coords.append([intron_end, None])

        coords[-1][1] = end

        return coords

    except Exception as e:
        print(f"Error calculating coordinate chain for tid {tid}: {e}")
        return []

def get_transcript_data_by_dataset(tid):
    """
    Get transcript data organized by dataset
    """
    try:
        transcript_data_query = """
            SELECT 
                td.td_id,
                td.dataset_id,
                td.data,
                d.name as dataset_name,
                d.description as dataset_description,
                d.data_type
            FROM transcript_data td
            JOIN dataset d ON td.dataset_id = d.dataset_id
            WHERE td.tid = :tid
            ORDER BY d.name
        """
        
        data_results = db.session.execute(text(transcript_data_query), {"tid": tid}).fetchall()
        
        datasets = {}
        for row in data_results:
            if row.dataset_id not in datasets:
                datasets[row.dataset_id] = {
                    "dataset_id": row.dataset_id,
                    "dataset_name": row.dataset_name,
                    "dataset_description": row.dataset_description,
                    "data_type": row.data_type,
                    "data_entries": []
                }
            
            datasets[row.dataset_id]["data_entries"].append({
                "td_id": row.td_id,
                "data": row.data
            })
        
        # Convert to list format
        return list(datasets.values())
        
    except Exception as e:
        print(f"Error fetching transcript data for tid {tid}: {e}")
        return []

def get_pdb_file(td_id):
    """
    Get the pdb file for a specific transcript data entry
    """
    try:
        result = db.session.execute(text("""
            SELECT data FROM transcript_data 
            JOIN dataset ON transcript_data.dataset_id = dataset.dataset_id
            WHERE td_id = :td_id and data_type = 'pdb'
        """), {"td_id": td_id}).fetchone()
        
        if not result:
            raise Exception(f"No pdb file found for td_id {td_id}")
            
        url = result.data.strip()
        
        return {
            "url": url,
            "file_name": url.split('/')[-1]
        }
    except Exception as e:
        raise e

def get_full_transcript_data(tid, transcript_id, sva_id, assembly_id, nomenclature):
    try:
        # Get basic transcript info
        transcript_base = db.session.execute(text("""
            SELECT t.tid, t.sequence_id, t.strand, t.start, t.end
            FROM transcript t
            WHERE t.tid = :tid
        """), {"tid": tid}).fetchone()
        if not transcript_base:
            return {"success": False, "message": "Transcript not found"}

        # Get transcript cross-reference
        tx_dbxref = db.session.execute(text("""
            SELECT txd.transcript_id, txd.start, txd.end, txd.type_value as transcript_type,
                   txd.cds_start, txd.cds_end, txd.score, txd.sva_id
            FROM tx_dbxref txd
            WHERE txd.tid = :tid AND txd.transcript_id = :transcript_id AND txd.sva_id = :sva_id
        """), {"tid": tid, "transcript_id": transcript_id, "sva_id": sva_id}).fetchone()
        if not tx_dbxref:
            return {"success": False, "message": "Transcript ID not found for this transcript"}

        # Use unified coordinate chain
        exon_chain = get_exon_chain(tid)
        exon_chain = cut(exon_chain, tx_dbxref.start, tx_dbxref.end)
        cds_chain = []
        if tx_dbxref.cds_start and tx_dbxref.cds_end:
            cds_chain = get_exon_chain(tid)
            cds_chain = cut(cds_chain, tx_dbxref.cds_start, tx_dbxref.cds_end)

        # Get attributes
        attributes_rows = db.session.execute(text("""
            SELECT ta.key_name, ta.value_cat, ta.value_text
            FROM tx_attribute ta
            WHERE ta.tid = :tid AND ta.transcript_id = :transcript_id AND ta.sva_id = :sva_id
        """), {"tid": tid, "transcript_id": transcript_id, "sva_id": tx_dbxref.sva_id}).fetchall()
        
        attributes = {
            'transcript_type': tx_dbxref.transcript_type,
            'sequence_id': transcript_base.sequence_id
        }
        for attr in attributes_rows:
            value = attr.value_text if attr.value_text else attr.value_cat
            attributes[attr.key_name] = value

        # Get datasets
        dataset_rows = db.session.execute(text("""
            SELECT d.dataset_id, d.name as dataset_name, d.description as dataset_description,
                   d.data_type, td.td_id, td.data
            FROM transcript_data td
            JOIN dataset d ON td.dataset_id = d.dataset_id
            WHERE td.tid = :tid AND td.transcript_id = :transcript_id AND td.sva_id = :sva_id
            ORDER BY d.dataset_id, td.td_id
        """), {"tid": tid, "transcript_id": transcript_id, "sva_id": tx_dbxref.sva_id}).fetchall()

        datasets = {}
        for row in dataset_rows:
            if row.dataset_id not in datasets:
                datasets[row.dataset_id] = {
                    'dataset_id': row.dataset_id,
                    'dataset_name': row.dataset_name,
                    'dataset_description': row.dataset_description,
                    'data_type': row.data_type,
                    'data_entries': []
                }
            datasets[row.dataset_id]['data_entries'].append({
                'td_id': row.td_id,
                'data': row.data
            })

        # get fasta file path
        fasta_file_path = get_fasta_file(assembly_id, nomenclature)
        if not fasta_file_path:
            return {"success": False, "message": "Failed to get fasta file"}
        fasta_file_path = fasta_file_path['file_path'] + "/" + fasta_file_path['file_name']

        # get sequence id for given assembly and nomenclature
        sequence_name = sequence_id_to_name(assembly_id, nomenclature, transcript_base.sequence_id)
        if not sequence_name:
            return {"success": False, "message": "Failed to get sequence id"}

        # Get nucleotide sequence
        try:
            nt_sequence = extract_transcript_sequence(fasta_file_path, sequence_name, exon_chain, bool(transcript_base.strand))
        except Exception as e:
            return {"success": False, "message": f"Failed to get nucleotide sequence: {str(e)}"}

        try:
            cds_sequence = extract_transcript_sequence(fasta_file_path, sequence_name, cds_chain, bool(transcript_base.strand))
        except Exception as e:
            return {"success": False, "message": f"Failed to get CDS sequence: {str(e)}"}

        cds_aa_sequence = translate_sequence(cds_sequence) if cds_sequence else None

        return {
            "success": True,
            "data": {
                'tid': tid,
                'transcript_id': transcript_id,
                'transcript_type': tx_dbxref.transcript_type,
                'sequence_id': transcript_base.sequence_id,
                'strand': bool(transcript_base.strand),
                'coordinates': {'start': tx_dbxref.start, 'end': tx_dbxref.end},
                'exons': exon_chain,
                'cds': cds_chain,
                'nt_sequence': nt_sequence,
                'cds_sequence': cds_sequence,
                'cds_aa_sequence': cds_aa_sequence,
                'datasets': list(datasets.values()),
                'attributes': attributes
            }
        }

    except Exception as e:
        return {"success": False, "message": f"Failed to fetch transcript data: {str(e)}"}
