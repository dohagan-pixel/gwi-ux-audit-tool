async function getToken(sa) {
  const {createSign} = require('crypto');
  const now = Math.floor(Date.now() / 1000);
  const hdr = Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT'})).toString('base64url');
  const pay = Buffer.from(JSON.stringify({iss:sa.client_email,scope:'https://www.googleapis.com/auth/analytics.readonly',aud:'https://oauth2.googleapis.com/token',exp:now+3600,iat:now})).toString('base64url');
  const sign = createSign('RSA-SHA256');
  sign.update(hdr+'.'+pay);
  const sig = sign.sign(sa.private_key,'base64url');
  const jwt = hdr+'.'+pay+'.'+sig;
  const r = await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt})});
  const d = await r.json();
  if (!d.access_token) throw new Error('Token error: '+JSON.stringify(d));
  return d.access_token;
}

async function gaReport(token, propertyId, pagePath, dimensions, metrics, limit) {
  const r = await fetch('https://analyticsdata.googleapis.com/v1beta/properties/'+propertyId+':runReport',{
    method:'POST',
    headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({
      dateRanges:[{startDate:'30daysAgo',endDate:'today'}],
      dimensions,
      metrics,
      dimensionFilter:pagePath?{filter:{fieldName:'pagePath',stringFilter:{matchType:'BEGINS_WITH',value:pagePath}}}:undefined,
      orderBys:[{metric:{metricName:metrics[0].name},desc:true}],
      limit:limit||10
    })
  });
  return r.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const {pagePath} = req.body || {};
  const propertyId = process.env.GA4_PROPERTY_ID;
  const saJson = process.env.GA_SERVICE_ACCOUNT_JSON;
  if (!propertyId || !saJson) return res.status(200).json({available:false,reason:'GA not configured'});
  try {
    const sa = JSON.parse(saJson);
    const token = await getToken(sa);
    const [deviceData, sourceData] = await Promise.all([
      gaReport(token, propertyId, pagePath,
        [{name:'deviceCategory'}],
        [{name:'sessions'},{name:'bounceRate'},{name:'averageSessionDuration'},{name:'screenPageViews'},{name:'newUsers'}]
      ),
      gaReport(token, propertyId, pagePath,
        [{name:'sessionDefaultChannelGroup'}],
        [{name:'sessions'}],
        5
      )
    ]);
    return res.status(200).json({available:true,deviceData,sourceData});
  } catch(e) {
    console.error('GA error:',e);
    return res.status(200).json({available:false,reason:String(e)});
  }
}
