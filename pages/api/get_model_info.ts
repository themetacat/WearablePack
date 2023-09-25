// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import api from '../../lib/api';

export default async (req, res) => {
  const { tokenId} = req.query;
  
  const data = await api.getModelInfo(req.query.token_id);

  res.statusCode = 200;

  res.json(data);
};
