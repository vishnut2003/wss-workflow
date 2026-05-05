import "server-only";
import { ObjectId, type Collection, type WithId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import {
  isFeedbackCategory,
  type FeedbackCategory,
  type FeedbackListItem,
} from "@/lib/feedback/categories";

export type FeedbackDoc = {
  _id: ObjectId;
  userId?: string;
  userEmail: string;
  userName: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  createdAt: Date;
};

export type CreateFeedbackInput = {
  userId?: string;
  userEmail: string;
  userName: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
};

let indexEnsured = false;

async function feedbackCollection(): Promise<Collection<FeedbackDoc>> {
  const db = await getDb();
  const col = db.collection<FeedbackDoc>("feedback");
  if (!indexEnsured) {
    await col.createIndex({ createdAt: -1 });
    indexEnsured = true;
  }
  return col;
}

export async function createFeedback(
  input: CreateFeedbackInput
): Promise<{ id: string }> {
  const col = await feedbackCollection();
  const result = await col.insertOne({
    _id: new ObjectId(),
    userId: input.userId,
    userEmail: input.userEmail.trim().toLowerCase(),
    userName: input.userName.trim(),
    category: input.category,
    subject: input.subject.trim(),
    message: input.message.trim(),
    createdAt: new Date(),
  });
  return { id: result.insertedId.toString() };
}

export async function listFeedback(): Promise<FeedbackListItem[]> {
  const col = await feedbackCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d: WithId<FeedbackDoc>) => ({
    id: d._id.toString(),
    userId: d.userId,
    userEmail: d.userEmail,
    userName: d.userName,
    category: isFeedbackCategory(d.category) ? d.category : "other",
    subject: d.subject,
    message: d.message,
    createdAt: (d.createdAt instanceof Date ? d.createdAt : new Date()).toISOString(),
  }));
}
