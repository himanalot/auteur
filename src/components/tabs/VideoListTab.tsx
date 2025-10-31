import React, { useState, useEffect } from 'react';

interface VideoLayer {
  name: string;
  filePath: string;
  width: number;
  height: number;
  duration: number;
  frameRate: number;
  id: number;
}

interface ActiveComp {
  name: string;
  width: number;
  height: number;
  duration: number;
  frameRate: number;
}

const VideoListTab: React.FC = () => {
  const [videos, setVideos] = useState<VideoLayer[]>([]);
  const [activeComp, setActiveComp] = useState<ActiveComp | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVideos = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!(window as any).CSInterface) {
        throw new Error('CSInterface not available');
      }

      const csInterface = new (window as any).CSInterface();

      // Test: Simple JSON test
      console.log('🧪 Testing simple JSON return...');
      const simpleTest = await new Promise<string>((resolve) => {
        csInterface.evalScript('testSimpleJSON()', (evalResult: string) => {
          resolve(evalResult);
        });
      });
      console.log('🧪 Simple JSON Result:', simpleTest);

      // Actual call
      console.log('📹 Calling getVideoFootageLayers...');
      const result = await new Promise<string>((resolve) => {
        csInterface.evalScript('getVideoFootageLayers()', (evalResult: string) => {
          resolve(evalResult);
        });
      });

      console.log('📹 Final result:', result);

      if (!result || result.trim() === '') {
        throw new Error('Empty result from ExtendScript - check console for test results');
      }

      const parsed = JSON.parse(result);

      if (parsed.success) {
        setVideos(parsed.data || []);
        setActiveComp(parsed.activeComp || null);
      } else {
        setError(parsed.message || 'Failed to fetch videos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('❌ Failed to fetch videos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const filteredVideos = videos.filter(video =>
    video.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.filePath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (filePath: string): string => {
    // This would need ExtendScript support to get actual file size
    return 'N/A';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="tab-content" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e0e0e0'
      }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '20px' }}>
          🎬 Video Footage in Active Comp
        </h2>
        {activeComp ? (
          <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
            <p style={{ margin: '0 0 4px 0', color: '#333', fontSize: '14px', fontWeight: 'bold' }}>
              📐 {activeComp.name}
            </p>
            <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
              {activeComp.width}x{activeComp.height} • {activeComp.duration.toFixed(2)}s • {activeComp.frameRate} fps
            </p>
          </div>
        ) : (
          <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: '13px', fontStyle: 'italic' }}>
            No active composition selected
          </p>
        )}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'inherit'
          }}
        />
        <button
          onClick={fetchVideos}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: isLoading ? '#ccc' : '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? '⏳ Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        fontSize: '13px'
      }}>
        <div>
          <strong>Total Videos:</strong> {videos.length}
        </div>
        <div>
          <strong>Filtered:</strong> {filteredVideos.length}
        </div>
        <div>
          <strong>Total Duration:</strong> {formatDuration(videos.reduce((sum, v) => sum + v.duration, 0))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '6px',
          color: '#c33',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Video List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '12px',
        alignContent: 'start'
      }}>
        {isLoading ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '40px',
            color: '#666',
            fontSize: '14px'
          }}>
            Loading videos...
          </div>
        ) : filteredVideos.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '40px',
            color: '#666',
            fontSize: '14px'
          }}>
            {videos.length === 0 ? 'No video footage found in project' : 'No videos match your search'}
          </div>
        ) : (
          filteredVideos.map((video) => (
            <div
              key={video.id}
              style={{
                padding: '12px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'box-shadow 0.2s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
              }}
            >
              {/* Video Icon and Name */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: '8px'
              }}>
                <div style={{ fontSize: '24px', marginRight: '8px' }}>🎬</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '14px',
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#333'
                  }} title={video.name}>
                    {video.name}
                  </div>
                </div>
              </div>

              {/* Video Specs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                marginBottom: '8px',
                fontSize: '12px',
                color: '#666'
              }}>
                <div>
                  <strong>Resolution:</strong><br />
                  {video.width} × {video.height}
                </div>
                <div>
                  <strong>Duration:</strong><br />
                  {formatDuration(video.duration)}
                </div>
                <div>
                  <strong>Frame Rate:</strong><br />
                  {video.frameRate} fps
                </div>
                <div>
                  <strong>ID:</strong><br />
                  {video.id}
                </div>
              </div>

              {/* File Path */}
              <div style={{
                fontSize: '11px',
                color: '#999',
                marginBottom: '8px',
                padding: '6px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }} title={video.filePath}>
                📁 {video.filePath}
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '6px'
              }}>
                <button
                  onClick={() => copyToClipboard(video.name)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '11px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  title="Copy name"
                >
                  📋 Name
                </button>
                <button
                  onClick={() => copyToClipboard(video.filePath)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '11px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  title="Copy path"
                >
                  📋 Path
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VideoListTab;
