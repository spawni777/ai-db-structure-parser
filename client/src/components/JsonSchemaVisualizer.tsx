import { useState, useEffect } from 'react';
import { ReactFlow, Node, Edge, NodeTypes} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DbColumn, DbSchema } from '../types/dbSchema';
import dagre from 'dagre';
import TableNode from './TableNode';
import TableEdge from './TableEdge';

type Props = {
  schema: DbSchema;
};

const nodeWidth = 400;
const baseNodeHeight = 100; // Base height for a node without columns
const columnHeight = 20; // Additional height per column

// Calculate node height based on the number of columns
const calculateNodeHeight = (columns: DbColumn[]) => {
  return baseNodeHeight + columns.length * columnHeight;
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

      // Create a node for each table
      newNodes.push({
        id: table.table_name, // Unique id for each node
        type: 'tableNode',
        data: {
          label: table.table_name, // Label to show the table name
          columns: table.columns,
        },
        position: { x: 0, y: 0 }, // Position will be updated by dagre
        style: { width: nodeWidth, height: nodeHeight }, // Set dynamic height here
      });

      // Create edges for the relationships
      table.relationships.forEach((relationship) => {
        newEdges.push({
          id: `${table.table_name}-${relationship.related_table}`,
          // type: 'smoothstep',
          source: table.table_name,
          target: relationship.related_table,
          data: {
            startLabel: relationship.relationship_type
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
