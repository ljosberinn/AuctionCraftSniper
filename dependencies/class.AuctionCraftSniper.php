<?php

class AuctionCraftSniper
{

    /**
     * @var object $connection [database connection]
     */
    private $connection;

    /**
     * @var array $regions [valid regions as strings ]
     */
    private $regions = ['EU', 'US'];

    /**
     * @var array $realms [private realms to be filled by setRealms()]
     */
    private $realms = [];

    /**
     * @var array $professions [private professions to be filled by setProfessions()]
     */
    private $professions = [];

    /**
     * @var array $recipes [contains valid recipes]
     */
    private $recipes = [];

    /**
     * @var array [long list of all relevant itemIDs]
     */
    private $itemIDs = [];

    /**
     * @method __construct
     * @param boolean $indexInit [controls automatic filling of $realms and $professions; default false]
     */
    public function __construct($indexInit = false, $professionsToQuery = []) {
        $db = require_once 'db.php';

        $this->connection = new mysqli($db['host'], $db['user'], $db['pw'], $db['db']);
        $this->connection->set_charset('utf8');

        $this->setProfessions();

        if ($indexInit) {
            $this->setRealms();
        } else {
            #$this->setRecipes($professionsToQuery);
            $this->setItemIDs();
        }
    }

    final private function setItemIDs() {
        $itemIDQuery = 'SELECT `id` FROM `recipes` ORDER BY `id` ASC';

        $data = $this->connection->query($itemIDQuery);

        if ($data->num_rows > 0) {
            while ($stream = $data->fetch_assoc()) {
                $this->itemIDs[] = $stream['id'];
            }
        }
    }

    final public function getItemIDs() {
        return $this->itemIDs;
    }

    /**
     * @return array
     */
    final public function getRecipes() {
        return $this->recipes;
    }

    /**
     * @param array $professionsToQuery [professionIDs to query]
     */
    final private function setRecipes(array $professionsToQuery = []) {

        $validProfessions = array_keys($this->professions);

        $tmpProfessionsToQuery = [];

        foreach ($professionsToQuery as $professionID) {
            if (in_array((int)$professionID, $validProfessions)) {
                $tmpProfessionsToQuery[] = $professionID;
            }
        }

        if (!empty($tmpProfessionsToQuery)) {
            $recipesQuery = 'SELECT * FROM `recipes` WHERE `profession` = ';

            foreach ($tmpProfessionsToQuery as $tmpProfessionID) {
                $recipesQuery .= $tmpProfessionID . ' OR `profession` = ';
            }

            $recipesQuery = substr($recipesQuery, 0, -19) . ' ORDER BY `id` DESC, `name` ASC';

            $data = $this->connection->query($recipesQuery);

            if ($data->num_rows > 0) {
                while ($stream = $data->fetch_assoc()) {
                    $this->recipes[$stream['profession']][] = [
                        'recipeID'   => $stream['id'],
                        'recipeName' => $stream['name'],
                    ];
                }
            }
        }
    }

    /**
     * @method setRealms [initializes private realm array]
     */
    final private function setRealms() {
        foreach ($this->regions as $region) {
            $realmQuery = "SELECT `house`, `name` FROM `realms` WHERE `region` = '" . $region . "' ORDER BY `name` ASC";
            $data       = $this->connection->query($realmQuery);

            if ($data->num_rows > 0) {
                while ($stream = $data->fetch_assoc()) {
                    $this->realms[] = $region . '-' . $stream['name'];
                }
            }
        }
    }

    /**
     * @method setProfessions [initializes private profession array]
     */
    final private function setProfessions() {
        $professionQuery = "SELECT * FROM `professions` ORDER BY `name` ASC";

        $data = $this->connection->query($professionQuery);

        if ($data->num_rows > 0) {
            while ($stream = $data->fetch_assoc()) {
                $this->professions[$stream['id']] = $stream['name'];
            }
        }
    }

    /**
     * @method getProfessions [returns private profession array]
     */
    final public function getProfessions() {
        return $this->professions;
    }

    /**
     * @method getRealms [returns private realm array]
     */
    final public function getRealms() {
        return $this->realms;
    }
}
