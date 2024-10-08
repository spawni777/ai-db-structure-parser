import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { merge } from 'lodash';

// Define the path where you want to save the table files
const ENTITY_FILES_DIR = path.resolve(__dirname, '../data/entities');

// Ensure that the directory exists
const ensureDirectoryExists = async (dir: string) => {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (err) {
        console.error('Error creating directory:', err);
    }
};

// Function to merge columns without overwriting known data types
const mergeColumns = (existingColumns: any[], incomingColumns: any[]) => {
    const mergedColumns = [...existingColumns];

    for (const incomingCol of incomingColumns) {
        const existingColIndex = existingColumns.findIndex(
            (col) => col.column_name.toLowerCase() === incomingCol.column_name.toLowerCase()
        );

        if (existingColIndex !== -1) {
            const existingCol = existingColumns[existingColIndex];
            // If the existing column has a known data type, preserve it
            if (existingCol.data_type !== 'unknown') {
                continue;
            } else {
                // Replace 'unknown' data type with the incoming one if available
                mergedColumns[existingColIndex] = incomingCol;
            }
        } else {
            // Add new columns
            mergedColumns.push(incomingCol);
        }
    }

    return mergedColumns;
};

// Function to merge relationships without duplicates
const mergeRelationships = (existing: any[], incoming: any[]) => {
    const mergedRelationships = [...existing];

    for (const incomingRel of incoming) {
        const exists = existing.some(
            (rel) =>
                rel.related_table.toLowerCase() === incomingRel.related_table.toLowerCase() &&
                rel.relationship_type === incomingRel.relationship_type
        );
        if (!exists) {
            mergedRelationships.push(incomingRel);
        }
    }

    return mergedRelationships;
};

// Save or update entity tables
export const saveEntities = async (req: Request, res: Response): Promise<void> => {
    const { tables } = req.body;

    if (!tables || !Array.isArray(tables)) {
        res.status(400).json({ error: 'Tables data is required and should be an array.' });
        return;
    }

    try {
        // Ensure the directory for entities exists
        await ensureDirectoryExists(ENTITY_FILES_DIR);

        // Process each table
        for (const table of tables) {
            // Convert table_name to lowercase
            const tableName = table.table_name.toLowerCase();
            const filePath = path.join(ENTITY_FILES_DIR, `${tableName}.json`);

            let mergedTableData = { ...table, table_name: tableName }; // Ensure table_name is in lowercase

            // Check if the file already exists
            try {
                const existingData = await fs.readFile(filePath, 'utf8');
                const parsedData = JSON.parse(existingData);

                // Merge the new table data with the existing one
                mergedTableData = merge({}, parsedData, mergedTableData);

                // Handle columns specifically to avoid overwriting known data types
                mergedTableData.columns = mergeColumns(parsedData.columns || [], mergedTableData.columns || []);

                // Handle relationships specifically to avoid duplicates
                mergedTableData.relationships = mergeRelationships(parsedData.relationships || [], mergedTableData.relationships || []);
            } catch (err) {
                // @ts-ignore
                if (err.code !== 'ENOENT') {
                    console.error(`Error reading file ${filePath}:`, err);
                    res.status(500).json({ error: 'Error processing entity files.' });
                    return;
                }
            }

            // Write the merged data back to the file
            await fs.writeFile(filePath, JSON.stringify(mergedTableData, null, 2), 'utf8');
        }

        res.status(200).json({ message: 'Entity saved successfully.' });
    } catch (error) {
        console.error('Error saving entity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getEntities = async (req: Request, res: Response): Promise<void> => {
    try {
        // Check if the directory exists
        const files = await fs.readdir(ENTITY_FILES_DIR);

        const tables = [];

        // Process each JSON file and read its contents
        for (const file of files) {
            if (path.extname(file) === '.json') {
                const filePath = path.join(ENTITY_FILES_DIR, file);
                try {
                    const fileData = await fs.readFile(filePath, 'utf8');
                    const tableData = JSON.parse(fileData);
                    tables.push(tableData);
                } catch (err) {
                    console.error(`Error reading file ${file}:`, err);
                    res.status(500).json({ error: 'Error reading entity files.' });
                    return;
                }
            }
        }

        // Return the tables in the response
        res.status(200).json(tables);
    } catch (error) {
        console.error('Error getting entities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteEntity = async (req: Request, res: Response): Promise<void> => {
    const { name } = req.params;
  
    if (!name) {
      res.status(400).json({ error: 'Entity name is required.' });
      return;
    }
  
    try {
      const filePath = path.join(ENTITY_FILES_DIR, `${name}.json`);
  
      // Check if the file exists
      try {
        await fs.access(filePath);  // Check if the file exists
      } catch (err) {
        res.status(404).json({ error: `Entity with name "${name}" not found.` });
        return;
      }
  
      // Delete the file
      await fs.unlink(filePath);
      res.status(200).json({ message: `Entity "${name}" deleted successfully.` });
    } catch (error) {
      console.error('Error deleting entity:', error);
      res.status(500).json({ error: 'Failed to delete the entity.' });
    }
  };