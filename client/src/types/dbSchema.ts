export type DbRelashionship = {
  related_table: string;
  relationship_type: string;
}

export type DbColumn = {
  column_name: string;
  data_type: string;
}

export type DbEntity = {
  table_name: string;
  columns: DbColumn[],
  relationships: DbRelashionship[]
}

export type DbSchema = {
  tables: DbEntity[]
}