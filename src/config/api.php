<?php

//comandos da api
$url = "https://www.canalti.com.br/api/pokemons.json"; 
$curl = curl_init($url); 
//verificação do retorno da api
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true); 
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false); 
$pokemons = json_decode(curl_exec($curl));

?>