import { Injectable } from '@nestjs/common';
import { IndexDocumentDto } from './dto/index-document.dto';

type SearchDocument = {
  type: 'message' | 'channel' | 'user' | 'file';
  id: string;
  workspaceId: string;
  content: string;
  metadata?: Record<string, unknown>;
  indexedAt: Date;
};

@Injectable()
export class SearchService {
  private readonly documents = new Map<string, SearchDocument>();

  index(dto: IndexDocumentDto) {
    const key = `${dto.type}:${dto.id}`;
    const doc: SearchDocument = {
      type: dto.type,
      id: dto.id,
      workspaceId: dto.workspaceId,
      content: dto.content,
      metadata: dto.metadata,
      indexedAt: new Date(),
    };

    this.documents.set(key, doc);

    return {
      indexed: true,
      key,
      doc,
    };
  }

  search(
    workspaceId: string,
    query: string,
    type?: 'message' | 'channel' | 'user' | 'file',
    cursor?: string,
    limit = 20,
  ) {
    const boundedLimit = Math.max(1, Math.min(Number.isFinite(limit) ? limit : 20, 100));
    const q = query.toLowerCase();

    const rows = [...this.documents.values()]
      .filter((doc) => doc.workspaceId === workspaceId)
      .filter((doc) => (type ? doc.type === type : true))
      .filter((doc) => doc.content.toLowerCase().includes(q))
      .sort((a, b) => b.indexedAt.getTime() - a.indexedAt.getTime());

    const startIdx = cursor
      ? Math.max(rows.findIndex((doc) => `${doc.type}:${doc.id}` === cursor) + 1, 0)
      : 0;

    const data = rows.slice(startIdx, startIdx + boundedLimit).map((doc) => ({
      ...doc,
      cursor: `${doc.type}:${doc.id}`,
    }));

    return {
      data,
      paging: {
        cursor: data.length === boundedLimit ? data[data.length - 1].cursor : null,
        limit: boundedLimit,
      },
      total: rows.length,
    };
  }
}
