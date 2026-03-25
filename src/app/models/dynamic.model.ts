export interface ColumnDefinition {
    name: string;
    type: string;
    primaryKey: boolean;
}

export interface TableDefinition {
    tableName: string;
    columns: ColumnDefinition[];
}

export interface AuditLog {
    id: number;
    tableName: string;
    actionType: string;
    oldValue: string;
    newValue: string;
    username: string;
    actionDate: string;
}
