import { connectToDatabase } from '@/lib/mongodb';

const collectionName = 'captures';

interface Capture {
  _id: string; // explicitly set to string
  html: string;
  createdAt: Date;
}

export async function storeCapture(id: string, html: string) {
  const { db } = await connectToDatabase();
  const collection = db.collection<Capture>(collectionName);

  await collection.insertOne({
    _id: id,
    html,
    createdAt: new Date(),
  });

  console.log(`[MongoDB] Stored capture with ID: ${id}`);
}

export async function getCapture(id: string): Promise<string | null> {
  const { db } = await connectToDatabase();
  const collection = db.collection<Capture>(collectionName);

  const capture = await collection.findOne({ _id: id });
  return capture ? capture.html : null;
}

export async function deleteCapture(id: string): Promise<boolean> {
  const { db } = await connectToDatabase();
  const collection = db.collection<Capture>(collectionName);

  const result = await collection.deleteOne({ _id: id });
  return result.deletedCount === 1;
}
