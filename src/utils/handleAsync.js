const handleAsync = (requestHanlder) => {
  return async (req, res, next) => {
    Promise.resolve(requestHanlder(req, res, next)).catch((err) => {
      next(err);
    });
  };
};
export { handleAsync };
