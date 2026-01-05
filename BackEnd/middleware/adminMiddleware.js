module.exports = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Không xác thực' });
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin mới được thực hiện thao tác này' });
  }
  next();
};
