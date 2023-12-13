export interface Column {
    col_name: string;
    type: string;
}

export interface Table {
    table_name: string;
    columns: Column[];
}

export interface Edge {
    src_column: {
        table_name: string;
        col_name: string;
    };
    dst_column: {
        table_name: string;
        col_name: string;
    };
    confidence: number;
}