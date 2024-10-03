import { useEffect, useState } from 'react';
import axios from 'axios';
import Monaco from '@monaco-editor/react';
import { DbEntity } from './types/dbSchema';
import JsonSchemaVisualizer from './components/JsonSchemaVisualizer';


const App = () => {
  const [savedEntities, setSavedEntities] = useState<DbEntity[]>([]);
  const [userInput, setUserInput] = useState('');
  const [parsedEntities, setParsedEntities] = useState('');
  const [parsedEntitiesData, setParsedEntitiesData] = useState<DbEntity[]>([]);
  const [loadedEntities, setLoadedEntities] = useState('');
  const [gptLoading, setGptLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  const getSavedEntities = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/entities`);

      setSavedEntities(data ?? []);
    } catch (error) {
      console.error('Error fetching saved entities:', error);
      alert('Failed to get saved entities.');
    }
  }

  const handleSendToGpt = async () => {
    if (!userInput?.length) {
      alert('Input SQL query.');
      return;
    }

    setParsedEntities('');
    setGptLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/gpt/parse-entity`, {
        prompt: userInput,
      });

      setParsedEntitiesData(response.data?.tables ?? []);
      setParsedEntities(JSON.stringify(response.data, null, 2));  // Format JSON response
    } catch (error) {
      console.error('Error calling GPT API:', error);
    } finally {
      setGptLoading(false);
    }
  };

  const handleSaveEntities = async (jsonEntities: string) => {
    try {
      const parsedStructures = JSON.parse(jsonEntities);
      await axios.post(`${apiUrl}/entities/`, parsedStructures);
      alert('Entities saved successfully!');

      getSavedEntities();
    } catch (error) {
      console.error('Error saving response:', error);
      alert('Failed to save the response.');
    }
  };

  const showParsedEntity = (index: number) => {
    setParsedEntities(JSON.stringify({
      tables: [parsedEntitiesData[index]],
    }, null, 2))
  }

  const showSavedEntity = (index: number) => {
    setLoadedEntities(JSON.stringify({
      tables: [savedEntities[index]],
    }, null, 2))
  }

  const deleteSavedEntity = async (entityTableName: string) => {
    await axios.delete(`${apiUrl}/entities/${entityTableName}`);
    alert(`DbEntity "${entityTableName}" was deleted successfully!`);

    getSavedEntities();
  }

  useEffect(() => {
    getSavedEntities();
  }, []);

  return (
    <div style={{ padding: '2rem', maxHeight: '100%' }}>
      <h1>DB STRUCTURE PARSER</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>Enter your SQL query:</label>
        <div style={{ marginTop: '0.5rem' }}>
          <Monaco
            height="400px"  // Adjust height based on your needs
            language="sql"  // Set language to JSON for IntelliSense
            value={userInput}  // The JSON data to edit
            onChange={(newValue) => setUserInput(newValue || '')}  // Update state on change
            options={{
              minimap: { enabled: false },  // Disable minimap
              automaticLayout: true,  // Auto adjust layout
            }}
          />
        </div>
      </div>

      <button onClick={handleSendToGpt} style={{ marginBottom: '1rem' }} disabled={gptLoading}>
        {gptLoading ? 'Loading...' : 'Send to GPT'}
      </button>
      
      {!!parsedEntities.length && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label>Parsed Entities</label>

            <div className='parsed' style={{ marginTop: '0.5rem' }}>
              <div className='parsed__monaco'>
                <Monaco
                  height="400px"  // Adjust height based on your needs
                  language="json"  // Set language to JSON for IntelliSense
                  value={parsedEntities}  // The JSON data to edit
                  onChange={(newValue) => setParsedEntities(newValue || '')}  // Update state on change
                  options={{
                    minimap: { enabled: false },  // Disable minimap
                    automaticLayout: true,  // Auto adjust layout
                  }}
                />
              </div>
              
              <div className='parsed__entities'>
                {parsedEntitiesData.map((entity, index) => (
                  <div
                    className='parsed__item'
                    key={`${entity.table_name}-${index}-parsed`}
                    onClick={() => showParsedEntity(index)}
                  >
                    <div>{entity.table_name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button onClick={() => handleSaveEntities(parsedEntities)} style={{ marginBottom: '1rem' }}>Save Entities</button>
        </>
      )}

      {!!savedEntities.length && (
        <>
          <hr />
          <h2>Saved Entities</h2>

          <div className='saved'>
            <div className='saved__monaco'>
              <Monaco
                height="400px"  // Adjust height based on your needs
                language="json"  // Set language to JSON for IntelliSense
                value={loadedEntities}  // The JSON data to edit
                onChange={(newValue) => setLoadedEntities(newValue || '')}  // Update state on change
                options={{
                  minimap: { enabled: false },  // Disable minimap
                  automaticLayout: true,  // Auto adjust layout
                }}
              />

              <button onClick={() => handleSaveEntities(loadedEntities)} style={{ marginBottom: '1rem', marginTop: '1rem' }}>Resave DbEntity</button>
            </div>


            <div className='saved__entities'>
              {savedEntities.map((entity, index) => (
                <div
                  className='saved__item'
                  key={`${entity.table_name}-${index}`}
                  onClick={() => showSavedEntity(index)}
                >
                  <div style={{ marginRight: '1rem' }}>{entity.table_name}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSavedEntity(entity.table_name)
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          <h2>Saved Entities Visualizer</h2>
          <JsonSchemaVisualizer
            schema={{
              tables: savedEntities
            }}
          />
        </>
      )}
    </div>
  );
};

export default App;
