// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import api from '../../lib/api';

export default async (req, res) => {
  const { tokenId} = req.query;
  
  const data = await api.get_wearable_pack_metadata(req.query.token_id);
console.log(req.query.token_id,444);

  res.statusCode = 200;

  res.json(data);
};
