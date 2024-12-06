import { PaginatedDocument } from "./PaginatedDocument.js";

const handlePaginationParams = (req) => {
  const { page, size, order } = req.query;
  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(size) || 10,
  };

  const dir = parseInt(order) || 1;

  return { options, dir };
};

const makePaginatedResponse = (data, dir) => {
  return new PaginatedDocument(
    data.docs,
    data.limit,
    data.page,
    dir,
    data.totalDocs,
    data.totalPages,
    data.hasPrevPage,
    data.hasNextPage
  );
};

export { handlePaginationParams, makePaginatedResponse };
