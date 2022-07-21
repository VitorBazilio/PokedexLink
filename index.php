<?php include_once("src/config/api.php"); ?>
<!DOCTYPE html>
<html>
    <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            
        <link href="src/img/pokedex.ico"  rel="shortcut icon" type="image/x-icon" style="font-size:6em;" />
        <link href="src/css/pokemon.css" rel="stylesheet" type="text/css" /> 
        <link href="src/css/main.css" rel="stylesheet" type="text/css" /> 
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
            <title>Pokédex - Api </title>
        </head>
    <body>
        <header class="">
            <a href="index.php" class="container title logo s-top">Pokedex</a>
        </header>
       <!-- Inicio da  logica de troca de detalhe pra dex --> 
        <?php 
        $i = 1;
      
        if(!isset($_GET['pokemon'])){

            //CODIGO DE TODOS OS POKEMONS

            echo '
            <main class="container mt-5"> 
            ' ; if(count($pokemons->pokemon)) {
                $p = 0;
                foreach($pokemons->pokemon as $Pokemon) {
                    $p++;
                    
                    if($p % 3 == 1) { echo '<div class="row"> ' ;}

                   echo '<div class="col-4 max-hg " >
                        <a href="index.php?pokemon='. $Pokemon->id.'">
                        <div class="card ">
                        <img src="'. $imgPrimary . $Pokemon->id .'.png"alt="'.$Pokemon->name.'" class="card-img-top img">
                        <div class="card-body">
                            <div class="card-text content">
                            <h4>'.$Pokemon->name.'</h4>
                            <ul>
                            ';
                            if(empty($Pokemon->next_evolution)) {
                                echo 'Não possui proximas evoluções';
                                
                            }else{

                               echo 'Proximas evoluções: ';
                                foreach($Pokemon->next_evolution as $ProximaEvolucao) {
                                if(count($Pokemon->next_evolution ) > 1){
                                   if($i == 1){
                                        
                                   echo $ProximaEvolucao->name . ", ";
                                   $i ++;
                                   
                                   }else{
                                       
                                   echo $ProximaEvolucao->name . ". ";
                                   $i = 1;
                                   }
                                   
                                }else{
                                    
                                     echo $ProximaEvolucao->name . ". ";  
                                }
                                    
                                }
                            }
                                
                          echo  '</ul>
                            </div>
                        </div>
                    </div>
                    </a>
                    
                    </div>

                    
                    ';
                     if($p % 3 == 0){ echo'</div>';  }
                                                    }
                                                        }else{

                        echo'<strong> Nenhum pokemón retornado pela Api</strong>';

                    }
                    echo'</main>';
            
            

        }else if(isset($_GET['pokemon'])){

            //CODIGO DOS DETALHES
            echo '<main class="container mt-5 detail-poke">';
            
            foreach($pokemons->pokemon as $Pokemon) {
                
                if($Pokemon->id == $_GET['pokemon'] ) {
                    echo '
                    <div class="row d-flex justify-content-between col-12">
                    <div class="col-6 imagem-glass " ><img src="'. $imgPrimary. $_GET["pokemon"] .'.png" alt="'.$Pokemon->name.'" class="img-center-mod"></div>
                    <div class="col-6"> 
                            <div class="title-name-detail d-flex justify-content-between">
                                <img  class="icon-poke" src="'. $imgSecondary. $Pokemon->num .'.png"/>
                                <span class="sub-name-poke">Nu.&nbsp;'. $Pokemon->num .'</span>&nbsp;
                                <span class="sub-name-poke">'. $Pokemon->name .'</span>
                                <span class="icons-genre"></span>
                            </div> 
                            
                              
                            <table class="table">
                                    
                                <tbody>
                                  <tr>
                                    <td class="text-left">Tipo</td>
                                    <td class="text-right">';foreach($Pokemon->type as $tipo) {
                                        echo '<span class="type-'.$tipo.'">'.$tipo.'</span>&nbsp;';}echo '</td></td>
                                  </tr>
                                  <tr>
                                    <td class="text-left">Altura</td>
                                    <td class="text-right">'.$Pokemon->height.'</td>
                                  </tr>
                                  <tr>
                                    <td class="text-left">Peso</td>
                                    <td class="text-right">'.$Pokemon->weight.'</td>
                                  </tr>
                                  <tr>
                                    <td class="text-left">Fraquezas</td>
                                    <td class="text-right">';foreach($Pokemon->weaknesses as $fraqueza) {
                                           echo '<span class=" type-'.$fraqueza.'">'.$fraqueza.'</span>&nbsp;';}echo '</td>
                                  </tr>
                                  
                                </tbody>
                            </table>
                        </div>
                    </div>';
                }
    
            }
       '</main>';
        }
        
      ?>
        
    <script src="src/js/pokemon.js"></script>
    <script type="text/javascript" src="src/js/jquery-3.5.1.min.js "></script>  
    </body>
</html>