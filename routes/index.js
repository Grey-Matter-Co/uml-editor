let express = require('express');
let router = express.Router();


router.get('/', function(req, res) {
  res.render('index', { title: 'Flowchart' });
});

router.get('/editor', function(req, res) {
  res.render('editor', { title: 'Flowchart' });
});

module.exports = router;
/**
 * wenas. tienes problemas de internet? o soy yo
 * chale JAJAJA
 * ptm
 * hago push
 *
 * tú jajajaj me saca a cada rato
 */
