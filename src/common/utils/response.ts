// 成功响应格式，所有接口成功时都可以复用这个结构。
export function success(data: unknown = null, message = "ok") {
    return { success: true, message, data };
}

// 失败响应格式，配合全局错误中间件保持错误返回一致。
export function fail(message = "error", code = 500, data: unknown = null) {
    return { success: false, message, code, data };
}

// 分页响应格式。
export interface PaginationMeta {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResult<T = unknown> {
    success: true;
    message: string;
    data: {
        list: T[];
        pagination: PaginationMeta;
    };
}

export function paginated<T>(
    list: T[],
    total: number,
    page: number,
    pageSize: number,
    message = "ok",
): PaginatedResult<T> {
    return {
        success: true,
        message,
        data: {
            list,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        },
    };
}

export default { success, fail, paginated };