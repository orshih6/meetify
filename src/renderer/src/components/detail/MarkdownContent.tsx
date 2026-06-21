type MarkdownContentProps = {
  content: string
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      )
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="text-neutral-300 italic">
          {part.slice(1, -1)}
        </em>
      )
    }

    return part
  })
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const lines = content.trim().split('\n')
  const elements: React.JSX.Element[] = []
  let listItems: string[] = []
  let key = 0

  const flushList = (): void => {
    if (listItems.length === 0) {
      return
    }

    elements.push(
      <ul key={key++} className="my-3 list-disc space-y-2 pl-5 text-neutral-300">
        {listItems.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>
    )
    listItems = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      continue
    }

    if (trimmed.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={key++} className="text-2xl font-semibold text-white">
          {renderInline(trimmed.slice(2))}
        </h1>
      )
      continue
    }

    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={key++} className="mt-6 text-lg font-semibold text-white">
          {renderInline(trimmed.slice(3))}
        </h2>
      )
      continue
    }

    if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2))
      continue
    }

    flushList()
    elements.push(
      <p key={key++} className="mt-3 text-neutral-300">
        {renderInline(trimmed)}
      </p>
    )
  }

  flushList()

  return <div className="mt-8">{elements}</div>
}
