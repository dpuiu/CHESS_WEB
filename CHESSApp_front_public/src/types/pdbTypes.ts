export interface PDBData {
  td_id: number;
  pdb_content: string;
  url?: string;
  structure_info?: {
    title?: string;
    author?: string;
    resolution?: number;
    r_value?: number;
    r_free?: number;
    chains?: number;
    residues?: number;
    atoms?: number;
  };
}

export interface PDBState {
  pdbData: Record<number, PDBData>;
  loading: Record<number, boolean>;
  error: Record<number, string | null>;
  downloading: Record<number, boolean>;
}