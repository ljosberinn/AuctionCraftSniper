<?php

require_once '../dependencies/headers.php';

$url = 'http://auction-api-eu.worldofwarcraft.com/auction-data/5aa60247a919dc537f694c4883a5f21f/auctions.json';

copy($url, 'blackmoore.json');

die;

require_once 'JSONStreamingParser/Listener.php';
require_once 'JSONStreamingParser/Parser.php';
require_once 'JSONStreamingParser/Listener/IdleListener.php';
require_once 'JSONStreamingParser/Listener/InMemoryListener.php';

$listener = new \JsonStreamingParser\Listener\InMemoryListener();

$data = '{
"realms": [
	{"name":"Blackmoore","slug":"blackmoore"}],
"auctions": [
	{"auc":1221871829,"item":27678,"owner":"Fláshlíght","ownerRealm":"Blackmoore","bid":20050,"buyout":22278,"quantity":1,"timeLeft":"VERY_LONG","rand":0,"seed":0,"context":0},
	{"auc":1222658274,"item":140273,"owner":"Táschê","ownerRealm":"Blackmoore","bid":1486369634,"buyout":1486369634,"quantity":1,"timeLeft":"VERY_LONG","rand":0,"seed":0,"context":0},
	{"auc":1221347535,"item":22197,"owner":"Baldmongold","ownerRealm":"Blackmoore","bid":247494493,"buyout":257806764,"quantity":1,"timeLeft":"VERY_LONG","rand":0,"seed":0,"context":0},
	{"auc":1222658276,"item":14553,"owner":"Dween","ownerRealm":"Blackmoore","bid":169292153,"buyout":169292153,"quantity":1,"timeLeft":"LONG","rand":0,"seed":0,"context":0},
	{"auc":1221871825,"item":27678,"owner":"Fláshlíght","ownerRealm":"Blackmoore","bid":20050,"buyout":22278,"quantity":1,"timeLeft":"VERY_LONG","rand":0,"seed":0,"context":0},
	{"auc":1221347530,"item":160173,"owner":"Hamballe","ownerRealm":"Blackmoore","bid":2000297,"buyout":2990000,"quantity":1,"timeLeft":"VERY_LONG","rand":0,"seed":0,"context":0,"bonusLists":[{"bonusListId":4796},{"bonusListId":1713}],"modifiers":[{"type":9,"value":119}]},
	{"auc":1222133982,"item":126992,"owner":"Puriand","ownerRealm":"Blackmoore","bid":6042000,"buyout":6360000,"quantity":1,"timeLeft":"VERY_LONG","rand":0,"seed":0,"context":13,"bonusLists":[{"bonusListId":1710},{"bonusListId":3392},{"bonusListId":3408}]},
	{"auc":1221347524,"item":116177,"owner":"Baldmongold","ownerRealm":"Blackmoore","bid":43190396,"buyout":44989996,"quantity":1,"timeLeft":"VERY_LONG","rand":0,"seed":0,"context":13,"bonusLists":[{"bonusListId":54},{"bonusListId":525},{"bonusListId":535}]},
	{"auc":1221871837,"item":27678,"owner":"Fláshlíght","ownerRealm":"Blackmoore","bid":20050,"buyout":22278,"quantity":1,"timeLeft":"VERY_LONG","rand":0,"seed":0,"context":0},
	{"auc":1221871839,"item":27678,"owner":"Fláshlíght","ownerRealm":"Blackmoore","bid":20050,"buyout":22278,"quantity":1,"timeLeft":"VERY_LONG","rand":0,"seed":0,"context":0},
	{"auc":1221871832,"item":27678,"owner":"Fláshlíght","ownerRealm":"Blackmoore","bid":20050,"buyout":22278,"quantity":1,"timeLeft":"VERY_LONG","rand":0,"seed":0,"context":0},
	{"auc":1222658286,"item":128846,"owner":"Táschê","ownerRealm":"Blackmoore","bid":526452522,"buyout":526452522,"quantity":1,"timeLeft":"VERY_LONG","rand":0,"seed":0,"context":0},
	{"auc":1221871812,"item":109126,"owner":"Fláshlíght","ownerRealm":"Blackmoore","bid":8909,"buyout":9899,"quantity":1,"timeLeft":"VERY_LONG","rand":0,"seed":0,"context":0},
	{"auc":1221347549,"item":98864,"owner":"Baldmongold","ownerRealm":"Blackmoore","bid":48253874,"buyout":50264453,"quantity":1,"timeLeft":"VERY_LONG","rand":0,"seed":0,"context":0},
	{"auc":1221871815,"item":109126,"owner":"Fláshlíght","ownerRealm":"Blackmoore","bid":8909,"buyout":9899,"quantity":1,"timeLeft":"VERY_LONG","rand":0,"seed":0,"context":0}
	]
}';

$data = json_decode($data, true);
$data = $data['auctions'];

print_r($data);

$itemArr = [];

$stream = fopen($url, 'r');
try {
    $parser = new \JsonStreamingParser\Parser($stream, $listener);
    $parser->parse($itemArr);
    fclose($stream);
} catch (Exception $e) {
    fclose($stream);
    throw $e;
}
