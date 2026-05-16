import { z } from "zod";

/**
 * 分页查询参数。
 */
export interface PaginationQuery {
    page: number;
    pageSize: number;
}

/**
 * 默认分页参数。
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/**
 * 分页 query 参数的 Zod schema，可与其他 schema 合并使用。
 *
 * 用法：
 *   const ListSchema = z.object({
 *       keyword: z.string().optional(),
 *       ...paginationSchema.shape,
 *   });
 */
export const paginationSchema = z.object({
    page: z
        .string()
        .optional()
        .default(String(DEFAULT_PAGE))
        .transform((v) => {
            const n = Number(v);
            return Number.isNaN(n) || n < 1 ? DEFAULT_PAGE : n;
        }),
    pageSize: z
        .string()
        .optional()
        .default(String(DEFAULT_PAGE_SIZE))
        .transform((v) => {
            const n = Number(v);
            if (Number.isNaN(n) || n < 1) return DEFAULT_PAGE_SIZE;
            return n > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : n;
        }),
});

export type ParsedPagination = z.infer<typeof paginationSchema>;

/**
 * 将 query 字符串数组转换为数字分页参数（不依赖 Zod 时的轻量版本）。
 */
export function parsePagination(query: Record<string, string | string[] | undefined>): PaginationQuery {
    const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
    const rawPageSize = Array.isArray(query.pageSize) ? query.pageSize[0] : query.pageSize;

    let page = Number(rawPage);
    let pageSize = Number(rawPageSize);

    if (Number.isNaN(page) || page < 1) page = DEFAULT_PAGE;
    if (Number.isNaN(pageSize) || pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
    if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;

    return { page, pageSize };
}