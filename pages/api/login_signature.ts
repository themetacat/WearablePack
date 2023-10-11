// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import api from '../../lib/api';

export default async (req, res) => {
  const { address, signature,message } = req.body;
  const data = await api.loginSignature(address, signature,message);

  res.statusCode = 200;

  res.json(data);
};
