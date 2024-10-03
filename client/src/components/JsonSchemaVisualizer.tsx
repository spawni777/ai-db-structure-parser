import { useState, useEffect } from 'react';
import { ReactFlow, Node, Edge, NodeTypes} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DbColumn, DbSchema } from '../types/dbSchema';
import dagre from 'dagre';
import TableNode from './TableNode';

type Props = {
  schema: DbSchema;
};

const nodeWidth = 400;
const baseNodeHeight = 200; // Base height for a node without columns
const columnHeight = 20; // Additional height per column

// Calculate node height based on the number of columns
const calculateNodeHeight = (columns: DbColumn[]) => {
  let height = baseNodeHeight + columns.length * columnHeight;

  columns.forEach(column => {
    height += (column.enum ? Object.keys(column.enum).length * columnHeight : 0);
  });

  return height;
};

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 50, edgesep: 10, ranksep: 150 });

  nodes.forEach((node) => {
    const nodeHeight = calculateNodeHeight(node.data.columns as DbColumn[]);
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - calculateNodeHeight(node.data.columns as DbColumn[]) / 2,
    };
  });

  return { nodes, edges };
};

const JsonSchemaVisualizer = ({ schema }: Props) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Node types
  const nodeTypes: NodeTypes = {
    tableNode: TableNode,
  };

  const defaultViewport = {
    zoom: 0.1,
    x: 0,
    y: 20,
  }

  // Parse the JSON schema to create nodes and edges
  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
  
    schema.tables.forEach((table) => {
      const nodeHeight = calculateNodeHeight(table.columns);
  
      // Check if the table acts as a linked table (as you already did)
      const relatedTables = table.relationships
        .map(relationship => schema.tables.find(_table => _table.table_name === relationship.related_table))
        .filter(_table => _table !== undefined);
  
      schema.tables.forEach(_table => {
        _table.relationships.forEach(relationship => {
          if (relationship.related_table === table.table_name) {
            relatedTables.push(_table);
          }
        })
      })
  
      const isLinkedTable = table.columns.every((column) => 
        relatedTables
          .some(_table => _table.columns.findIndex(_column => _column.column_name === column.column_name) !== -1)
      );
  
      const tableLabel = isLinkedTable ? `[Linked Table] ${table.table_name}` : table.table_name;
  
      // Create a node for each table
      newNodes.push({
        id: table.table_name, // Unique id for each node
        type: 'tableNode',
        data: {
          label: tableLabel, // Label to show the table name
          columns: table.columns,
          isLinkedTable,
          gptSuggestedName: table.gpt_suggested_name,
        },
        position: { x: 0, y: 0 }, // Position will be updated by dagre
        style: { width: nodeWidth, height: nodeHeight }, // Set dynamic height here
      });
  
      // Create edges for the relationships
      table.relationships.forEach((relationship) => {
        newEdges.push({
          id: `${table.table_name}-${relationship.related_table}`,
          source: table.table_name,
          target: relationship.related_table,
          data: {
            startLabel: relationship.relationship_type,
          },
        });
      });
    });
  
    // Apply dagre layout to nodes and edges
    const layoutedElements = getLayoutedElements(newNodes, newEdges);
    setNodes(layoutedElements.nodes);
    setEdges(layoutedElements.edges);
  }, [schema]);

  return (
    <div style={{ height: '80vh', width: '100%', border: '1px solid #000', borderRadius: '10px', overflow: 'hidden' }}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} defaultViewport={defaultViewport}>
      </ReactFlow>
    </div>
  );
};

export default JsonSchemaVisualizer;
