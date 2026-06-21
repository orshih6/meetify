import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type ToolUIPart } from 'ai'

const STATE_TO_LABEL_MAP: Record<string, string> = {
  'input-streaming': 'Streaming input...',
  'input-available': 'Input ready',
  'approval-requested': 'Approval requested',
  'approval-responded': 'Approval responded',
  'output-available': 'Complete',
  'output-error': 'Error'
}

export default function Chat(): React.JSX.Element {
  const [input, setInput] = useState('')

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: `http://localhost:4111/chat/weather-agent`
    })
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <main
      style={{
        maxWidth: '48rem',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '1.5rem',
        width: '100%',
        height: '100vh'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto' }} data-name="conversation">
          <div
            data-name="conversation-content"
            style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
          >
            {messages.map((message, messageIndex) => (
              <div key={messageIndex}>
                {message.parts.map((part, partIndex) => {
                  if (part.type === 'text') {
                    return (
                      <div
                        key={partIndex}
                        data-name="message"
                        style={{
                          display: 'flex',
                          width: '100%',
                          maxWidth: '95%',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          ...(message.role === 'user'
                            ? { marginLeft: 'auto', justifyContent: 'flex-end' }
                            : {})
                        }}
                      >
                        <div
                          data-name="message-content"
                          style={{
                            display: 'flex',
                            width: 'fit-content',
                            maxWidth: '100%',
                            minWidth: 0,
                            flexDirection: 'column',
                            gap: '0.5rem',
                            overflow: 'hidden',
                            fontSize: '0.875rem',
                            ...(message.role === 'user'
                              ? {
                                  marginLeft: 'auto',
                                  borderRadius: '0.5rem',
                                  backgroundColor: '#dbeafe',
                                  paddingLeft: '1rem',
                                  paddingRight: '1rem',
                                  paddingTop: '0.75rem',
                                  paddingBottom: '0.75rem'
                                }
                              : {})
                          }}
                        >
                          <div
                            data-name="message-response"
                            style={{ width: '100%', height: '100%' }}
                          >
                            {part.text}
                          </div>
                        </div>
                      </div>
                    )
                  }
                  if (part.type.startsWith('tool-')) {
                    const toolPart = part as unknown as ToolUIPart
                    return (
                      <div
                        key={partIndex}
                        data-name="tool"
                        style={{
                          marginBottom: '1.5rem',
                          width: '100%',
                          borderRadius: '0.5rem',
                          border: '1px solid #d1d5db',
                          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
                        }}
                      >
                        <details
                          data-name="tool-header"
                          style={{ width: '100%', padding: '0.75rem', cursor: 'pointer' }}
                        >
                          <summary style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                            {toolPart.type.split('-').slice(1).join('-')} -{' '}
                            {STATE_TO_LABEL_MAP[toolPart.state ?? 'output-available']}
                          </summary>
                          <div data-name="tool-content">
                            <div
                              data-name="tool-input"
                              style={{
                                overflow: 'hidden',
                                paddingTop: '1rem',
                                paddingBottom: '1rem'
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 500,
                                  color: '#6b7280',
                                  fontSize: '0.75rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}
                              >
                                Parameters
                              </div>
                              <pre
                                style={{
                                  width: '100%',
                                  overflowX: 'auto',
                                  borderRadius: '0.375rem',
                                  border: '1px solid #d1d5db',
                                  backgroundColor: '#f9fafb',
                                  padding: '0.75rem',
                                  fontSize: '0.875rem'
                                }}
                              >
                                <code>{JSON.stringify(toolPart.input, null, 2)}</code>
                              </pre>
                            </div>
                            <div
                              data-name="tool-output"
                              style={{
                                overflow: 'hidden',
                                paddingTop: '1rem',
                                paddingBottom: '1rem'
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 500,
                                  color: '#6b7280',
                                  fontSize: '0.75rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}
                              >
                                {toolPart.errorText ? 'Error' : 'Result'}
                              </div>
                              <pre
                                style={{
                                  width: '100%',
                                  overflowX: 'auto',
                                  borderRadius: '0.375rem',
                                  border: '1px solid #d1d5db',
                                  backgroundColor: '#f9fafb',
                                  padding: '0.75rem',
                                  fontSize: '0.875rem'
                                }}
                              >
                                <code>{JSON.stringify(toolPart.output, null, 2)}</code>
                              </pre>
                              {toolPart.errorText && (
                                <div data-name="tool-error" style={{ color: '#dc2626' }}>
                                  {toolPart.errorText}
                                </div>
                              )}
                            </div>
                          </div>
                        </details>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            ))}
          </div>
        </div>
        <form
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '1.5rem',
            flexShrink: 0,
            paddingTop: '1rem'
          }}
          onSubmit={handleSubmit}
          data-name="prompt-input"
        >
          <input
            name="chat-input"
            style={{
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
              height: '2.5rem',
              padding: '0 0.75rem'
            }}
            placeholder="City name"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              border: '1px solid #60a5fa',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              whiteSpace: 'nowrap',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all',
              flexShrink: 0,
              outline: 'none'
            }}
            type="submit"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  )
}
