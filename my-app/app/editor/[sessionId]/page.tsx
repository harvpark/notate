//import { Canvas } from "@/components/editor/Canvas"
import Toolbar from "@/components/editor/Toolbar"


// app/editor/[sessionId]/page.tsx
export default async function Editor({ params }: { params: { sessionId: string } }) {
    //const session = await db.sessions.get(params.sessionId)
    
    return (
      <div>
        {/*
            <WebView url={session.originalUrl} />
            <Canvas />
            <ShareButton 
            onClick={() => redirect(`/share/${params.sessionId}`)} 
            />
        */}
        <Toolbar /> {/* Annotation tools */}
      </div>
    )
  }