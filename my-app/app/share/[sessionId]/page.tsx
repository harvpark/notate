// app/share/[sessionId]/page.tsx
export default async function SharedView({ params }: { params: { sessionId: string } }) {
    const session = await db.sessions.get(params.sessionId)
    
    return (
      <div>
        <WebView url={session.originalUrl} />
        <AnnotationOverlay annotations={session.annotations} />
      </div>
    )
  }