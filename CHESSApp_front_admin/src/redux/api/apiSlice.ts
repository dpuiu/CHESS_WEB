import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001/api';

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
    tagTypes: ['Database', 'Table', 'Organism', 'Assembly', 'Source', 'SourceVersion', 'Configuration', 'DatabaseConfig', 'GlobalData'],
    endpoints: (builder) => ({
        // Database Management
        getDatabaseList: builder.query<any, void>({
            query: () => '/admin/db_list',
            providesTags: ['Database'],
        }),
        getTableData: builder.query<any, { tableName: string; search?: string; limit?: number }>({
            query: ({ tableName, search, limit }) => {
                const params = new URLSearchParams();
                if (search) params.append('search', search);
                if (limit) params.append('limit', limit.toString());
                return `/admin/db_table_data/${tableName}?${params.toString()}`;
            },
            providesTags: (result, error, { tableName }) => [{ type: 'Table', id: tableName }],
        }),
        resetDatabase: builder.mutation<any, void>({
            query: () => ({
                url: '/admin/reset_db',
                method: 'POST',
            }),
            invalidatesTags: ['Database', 'Table', 'GlobalData', 'Organism', 'Assembly', 'Source', 'Configuration', 'DatabaseConfig'],
        }),
        clearTable: builder.mutation<any, string>({
            query: (tableName) => ({
                url: '/admin/clear_table',
                method: 'POST',
                body: { table_name: tableName },
            }),
            invalidatesTags: (result, error, tableName) => [{ type: 'Table', id: tableName }, 'GlobalData'],
        }),
        createBackup: builder.mutation<any, string>({
            query: (backupPath) => ({
                url: '/admin/create_backup',
                method: 'POST',
                body: { backup_path: backupPath },
            }),
        }),
        restoreBackup: builder.mutation<any, { backupPath: string; storageDirPath: string }>({
            query: ({ backupPath, storageDirPath }) => ({
                url: '/admin/restore_backup',
                method: 'POST',
                body: { backup_path: backupPath, storage_dir_path: storageDirPath },
            }),
            invalidatesTags: ['Database', 'Table', 'GlobalData', 'Organism', 'Assembly', 'Source', 'Configuration', 'DatabaseConfig'],
        }),
        getDatabaseConfig: builder.query<any, void>({
            query: () => '/admin/db_config',
            transformResponse: (response: { data: string, success: boolean }) => {
                return { data_dir: response.data };
            },
            providesTags: ['DatabaseConfig'],
        }),
        updateDatabaseConfig: builder.mutation<any, { data_dir: string }>({
            query: (config) => ({
                url: '/admin/set_db_config',
                method: 'POST',
                body: config,
            }),
            invalidatesTags: ['DatabaseConfig'],
        }),

        // Global Data
        getGlobalData: builder.query<any, void>({
            query: () => '/public/globalData',
            transformResponse: (response: any) => {
                return {
                    organisms: response.organisms || {},
                    assemblies: response.assemblies || {},
                    sources: response.sources || {},
                    configurations: response.configurations || {},
                    datasets: response.datasets || {
                        data_types: {},
                        datasets: {},
                    },
                };
            },
            providesTags: ['GlobalData'],
        }),

        // Organism Management
        addOrganism: builder.mutation<any, any>({
            query: (organismData) => ({
                url: '/admin/organisms',
                method: 'POST',
                body: organismData,
            }),
            invalidatesTags: ['Organism', 'GlobalData'],
        }),
        updateOrganism: builder.mutation<any, { taxonomy_id: number; organismData: any }>({
            query: ({ taxonomy_id, organismData }) => ({
                url: `/admin/organisms/${taxonomy_id}`,
                method: 'PUT',
                body: organismData,
            }),
            invalidatesTags: ['Organism', 'GlobalData'],
        }),
        deleteOrganism: builder.mutation<any, number>({
            query: (taxonomy_id) => ({
                url: `/admin/organisms/${taxonomy_id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Organism', 'GlobalData'],
        }),

        // Assembly Management
        addAssembly: builder.mutation<any, any>({
            query: (assemblyData) => ({
                url: '/admin/assemblies',
                method: 'POST',
                body: assemblyData,
            }),
            invalidatesTags: ['Assembly', 'GlobalData'],
        }),
        updateAssembly: builder.mutation<any, { assembly_id: number; assemblyData: any }>({
            query: ({ assembly_id, assemblyData }) => ({
                url: `/admin/assemblies/${assembly_id}`,
                method: 'PUT',
                body: assemblyData,
            }),
            invalidatesTags: ['Assembly', 'GlobalData'],
        }),
        deleteAssembly: builder.mutation<any, number>({
            query: (assembly_id) => ({
                url: `/admin/assemblies/${assembly_id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Assembly', 'GlobalData'],
        }),

        // Source Management
        addSource: builder.mutation<any, any>({
            query: (sourceData) => ({
                url: '/admin/add_to_source',
                method: 'POST',
                body: sourceData,
            }),
            invalidatesTags: ['Source', 'GlobalData'],
        }),
        updateSource: builder.mutation<any, { source_id: number; sourceData: any }>({
            query: ({ source_id, sourceData }) => ({
                url: `/admin/sources/${source_id}`,
                method: 'PUT',
                body: sourceData,
            }),
            invalidatesTags: ['Source', 'GlobalData'],
        }),
        deleteSource: builder.mutation<any, number>({
            query: (source_id) => ({
                url: `/admin/sources/${source_id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Source', 'GlobalData'],
        }),

        // Source Version Management
        addSourceVersion: builder.mutation<any, { source_id: number; svData: any }>({
            query: ({ source_id, svData }) => ({
                url: `/admin/sources/${source_id}/source-versions`,
                method: 'POST',
                body: svData,
            }),
            invalidatesTags: ['Source', 'GlobalData'],
        }),
        updateSourceVersion: builder.mutation<any, { source_id: number; sv_id: number; svData: any }>({
            query: ({ source_id, sv_id, svData }) => ({
                url: `/admin/sources/${source_id}/source-versions/${sv_id}`,
                method: 'PUT',
                body: svData,
            }),
            invalidatesTags: ['Source', 'GlobalData'],
        }),
        deleteSourceVersion: builder.mutation<any, { source_id: number; sv_id: number }>({
            query: ({ source_id, sv_id }) => ({
                url: `/admin/sources/${source_id}/source-versions/${sv_id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Source', 'GlobalData'],
        }),
        reorderSourceVersions: builder.mutation<any, { source_id: number; new_order: number[] }>({
            query: ({ source_id, new_order }) => ({
                url: `/admin/sources/${source_id}/source-versions/reorder`,
                method: 'POST',
                body: { new_order },
            }),
            invalidatesTags: ['Source', 'GlobalData'],
        }),
        removeSourceVersionAssembly: builder.mutation<any, { source_id: number; sv_id: number; sva_id: number }>({
            query: ({ source_id, sv_id, sva_id }) => ({
                url: `/admin/sources/${source_id}/source-versions/${sv_id}/assemblies/${sva_id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Source', 'GlobalData'],
        }),

        confirmAnnotationUpload: builder.mutation<any, { source_id: number; sv_id: number; confirmationData: any }>({
            query: ({ source_id, sv_id, confirmationData }) => ({
                url: `/admin/sources/${source_id}/source-versions/${sv_id}/confirm-annotation`,
                method: 'POST',
                body: confirmationData,
            }),
            invalidatesTags: ['Source', 'GlobalData'],
        }),

        // File Uploads
        uploadSourceVersionFile: builder.mutation<any, {
            source_id: number;
            file: File;
            sv_id: number;
            assembly_id: number;
            file_type: string;
            description?: string;
            onProgress?: (progress: number) => void;
        }>({
            queryFn: async ({ source_id, file, sv_id, assembly_id, file_type, description, onProgress }, { getState }) => {
                return new Promise((resolve) => {
                    const xhr = new XMLHttpRequest();
                    const formData = new FormData();
                    formData.append('gtf_file', file);
                    formData.append('assembly_id', assembly_id.toString());
                    if (description) {
                        formData.append('description', description);
                    }

                    if (onProgress) {
                        xhr.upload.onprogress = (event) => {
                            if (event.lengthComputable) {
                                const percentComplete = (event.loaded / event.total) * 100;
                                onProgress(percentComplete);
                            }
                        };
                    }

                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve({ data: JSON.parse(xhr.responseText) });
                        } else {
                            try {
                                resolve({ error: { status: xhr.status, data: JSON.parse(xhr.responseText) } });
                            } catch (e) {
                                resolve({ error: { status: xhr.status, data: xhr.responseText } });
                            }
                        }
                    };

                    xhr.onerror = () => {
                        resolve({ error: { status: 500, data: 'Network Error' } });
                    };

                    const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://127.0.0.1:5001/api';
                    xhr.open('POST', `${baseUrl}/admin/sources/${source_id}/source-versions/${sv_id}/upload-gtf`);
                    xhr.send(formData);
                });
            },
            invalidatesTags: ['Source', 'GlobalData'],
        }),
        // Configuration Management
        createConfiguration: builder.mutation<any, any>({
            query: (configData) => ({
                url: '/admin/configurations',
                method: 'POST',
                body: configData,
            }),
            invalidatesTags: ['Configuration', 'GlobalData'],
        }),
        updateConfiguration: builder.mutation<any, any>({
            query: (configData) => ({
                url: `/admin/configurations/${configData.configuration_id}`,
                method: 'PUT',
                body: configData,
            }),
            invalidatesTags: ['Configuration', 'GlobalData'],
        }),
        deleteConfiguration: builder.mutation<any, number>({
            query: (configurationId) => ({
                url: `/admin/configurations/${configurationId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Configuration', 'GlobalData'],
        }),
        activateConfiguration: builder.mutation<any, number>({
            query: (configurationId) => ({
                url: `/admin/configurations/${configurationId}/activate`,
                method: 'POST',
            }),
            invalidatesTags: ['Configuration', 'GlobalData'],
        }),

        // Dataset Management
        createDataset: builder.mutation<any, any>({
            query: (datasetData) => {
                const formData = new FormData();
                if (datasetData.name) formData.append('name', datasetData.name);
                if (datasetData.description) formData.append('description', datasetData.description);
                if (datasetData.data_type) formData.append('data_type', datasetData.data_type);
                if (datasetData.data_target) formData.append('data_target', datasetData.data_target);
                if (datasetData.sva_id) formData.append('sva_id', datasetData.sva_id.toString());
                if (datasetData.file) formData.append('file', datasetData.file);

                return {
                    url: '/admin/datasets',
                    method: 'POST',
                    body: formData,
                };
            },
            invalidatesTags: ['GlobalData'],
        }),
        updateDataset: builder.mutation<any, { datasetId: number; datasetData: any }>({
            query: ({ datasetId, datasetData }) => ({
                url: `/admin/datasets/${datasetId}`,
                method: 'PUT',
                body: datasetData,
            }),
            invalidatesTags: ['GlobalData'],
        }),
        deleteDataset: builder.mutation<any, number>({
            query: (datasetId) => ({
                url: `/admin/datasets/${datasetId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['GlobalData'],
        }),
        createDataType: builder.mutation<any, any>({
            query: (dataTypeData) => ({
                url: '/admin/datasets/add_data_type',
                method: 'POST',
                body: dataTypeData,
            }),
            invalidatesTags: ['GlobalData'],
        }),
        updateDataType: builder.mutation<any, { dataType: string; dataTypeData: any }>({
            query: ({ dataType, dataTypeData }) => ({
                url: '/admin/datasets/edit_data_type',
                method: 'POST',
                body: {
                    data_type: dataType,
                    description: dataTypeData.description || ''
                },
            }),
            invalidatesTags: ['GlobalData'],
        }),
        deleteDataType: builder.mutation<any, string>({
            query: (dataType) => ({
                url: '/admin/datasets/delete_data_type',
                method: 'POST',
                body: { data_type: dataType },
            }),
            invalidatesTags: ['GlobalData'],
        }),
        uploadTranscriptData: builder.mutation<any, { dataset_id: number; sva_id: number; data_type: string; file: File }>({
            query: ({ dataset_id, sva_id, data_type, file }) => {
                const formData = new FormData();
                formData.append('dataset_id', dataset_id.toString());
                formData.append('sva_id', sva_id.toString());
                formData.append('data_type', data_type);
                formData.append('file', file);

                return {
                    url: `/admin/datasets/${dataset_id}/upload`,
                    method: 'POST',
                    body: formData,
                };
            },
            invalidatesTags: ['GlobalData'],
        }),

        // Assembly File Uploads and Management
        uploadFastaFile: builder.mutation<any, {
            assembly_id: number;
            fasta_file: File;
            nomenclature: string;
            onProgress?: (progress: number) => void;
        }>({
            queryFn: async ({ assembly_id, fasta_file, nomenclature, onProgress }, { getState }) => {
                return new Promise((resolve) => {
                    const xhr = new XMLHttpRequest();
                    const formData = new FormData();
                    formData.append('fasta_file', fasta_file);
                    formData.append('assembly_id', assembly_id.toString());
                    formData.append('nomenclature', nomenclature);

                    if (onProgress) {
                        xhr.upload.onprogress = (event) => {
                            if (event.lengthComputable) {
                                const percentComplete = (event.loaded / event.total) * 100;
                                onProgress(percentComplete);
                            }
                        };
                    }

                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve({ data: JSON.parse(xhr.responseText) });
                        } else {
                            try {
                                resolve({ error: { status: xhr.status, data: JSON.parse(xhr.responseText) } });
                            } catch (e) {
                                resolve({ error: { status: xhr.status, data: xhr.responseText } });
                            }
                        }
                    };

                    xhr.onerror = () => {
                        resolve({ error: { status: 500, data: 'Network Error' } });
                    };

                    const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://127.0.0.1:5001/api';
                    xhr.open('POST', `${baseUrl}/admin/assemblies/upload-fasta`);
                    xhr.send(formData);
                });
            },
            invalidatesTags: ['Assembly', 'GlobalData'],
        }),
        uploadNomenclatureTsv: builder.mutation<any, {
            assembly_id: number;
            tsv_file: File;
            source_nomenclature: string;
            new_nomenclature: string;
        }>({
            query: ({ assembly_id, tsv_file, source_nomenclature, new_nomenclature }) => {
                const formData = new FormData();
                formData.append('tsv_file', tsv_file);
                formData.append('source_nomenclature', source_nomenclature);
                formData.append('new_nomenclature', new_nomenclature);

                return {
                    url: `/admin/assemblies/${assembly_id}/nomenclatures/upload-tsv`,
                    method: 'POST',
                    body: formData,
                };
            },
            invalidatesTags: ['Assembly', 'GlobalData'],
        }),
        removeNomenclatureFromAssembly: builder.mutation<any, { assembly_id: number; nomenclature: string }>({
            query: ({ assembly_id, nomenclature }) => ({
                url: `/admin/assemblies/${assembly_id}/nomenclatures/${encodeURIComponent(nomenclature)}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Assembly', 'GlobalData'],
        }),
    }),
});

export const {
    useGetDatabaseListQuery,
    useGetTableDataQuery,
    useLazyGetTableDataQuery,
    useResetDatabaseMutation,
    useClearTableMutation,
    useCreateBackupMutation,
    useRestoreBackupMutation,
    useGetDatabaseConfigQuery,
    useUpdateDatabaseConfigMutation,
    useGetGlobalDataQuery,
    useAddOrganismMutation,
    useUpdateOrganismMutation,
    useDeleteOrganismMutation,
    useAddAssemblyMutation,
    useUpdateAssemblyMutation,
    useDeleteAssemblyMutation,
    useAddSourceMutation,
    useUpdateSourceMutation,
    useDeleteSourceMutation,
    useAddSourceVersionMutation,
    useUpdateSourceVersionMutation,
    useDeleteSourceVersionMutation,
    useReorderSourceVersionsMutation,
    useRemoveSourceVersionAssemblyMutation,
    useUploadSourceVersionFileMutation,
    useConfirmAnnotationUploadMutation,
    useCreateConfigurationMutation,
    useUpdateConfigurationMutation,
    useDeleteConfigurationMutation,
    useActivateConfigurationMutation,
    useCreateDatasetMutation,
    useUpdateDatasetMutation,
    useDeleteDatasetMutation,
    useCreateDataTypeMutation,
    useUpdateDataTypeMutation,
    useDeleteDataTypeMutation,
    useUploadTranscriptDataMutation,
    useUploadFastaFileMutation,
    useUploadNomenclatureTsvMutation,
    useRemoveNomenclatureFromAssemblyMutation,
} = apiSlice;
