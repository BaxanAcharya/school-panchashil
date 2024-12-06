class PaginatedDocument {
  constructor(
    docs,
    limit,
    page,
    order,
    totalData,
    totalPages,
    hasPrevPage,
    hasNextPage
  ) {
    this.docs = docs;
    this.meta = {
      limit,
      page,
      order,
      totalData,
      totalPages,
      hasPrevPage,
      hasNextPage,
    };
  }
}

export { PaginatedDocument };
