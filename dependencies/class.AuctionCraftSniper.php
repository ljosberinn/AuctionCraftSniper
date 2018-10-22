<?php

class AuctionCraftSniper
{

    private $connection;

    private $regions = ['EU', 'US'];

    private $realms = [];

    private $professions = [];

    public function __construct() {
        $db = require_once './api/db.php';

        $this->connection = new mysqli($db['host'], $db['user'], $db['pw'], $db['db']);
        $this->connection->set_charset('utf8');

        $this->setRealms();
        $this->setProfessions();
    }

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

    final private function setProfessions() {
        $professionQuery = "SELECT * FROM `professions` ORDER BY `name` ASC";

        $data = $this->connection->query($professionQuery);

        if ($data->num_rows > 0) {
            while ($stream = $data->fetch_assoc()) {
                $this->professions[$stream['id']] = $stream['name'];
            }
        }
    }

    final public function getProfessions() {
        return $this->professions;
    }

    final public function getRealms() {
        return $this->realms;
    }
}
