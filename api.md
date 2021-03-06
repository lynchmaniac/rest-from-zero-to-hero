evolution superhero:

* http://orig00.deviantart.net/6214/f/2011/027/5/e/evolution_of_super_hero_by_artieyoon-d3851ye.jpg
* https://speakerdeck.com/antoinerichard/creatifs-boostez-votre-productivite?slide=38

# references
guide octo: http://blog.octo.com/designer-une-api-rest/
api hypermedia: http://www.slideshare.net/delirii/api-hypermedia-devoxx-fr



TECH 
hapi - mongo/ou mock

DEBUT
-----

# Zero
On a demandé a la société de service BonDev de realiser l'api REST du devfest
voici le resultat:

Tout est GET
Verbes dans l'URI (a.k.a. HTTP as a tunnel)

```
listerSpeakers => 200
infoSpeaker?id=34 => 200
modifierSpeaker?id=34 => 200 => sans reponse
ajouterSpeaker => 200
supprimerSpeaker?id=34 => 200

listerTalks
infoTalks
noterTalks
```

```json
{
  "id": 1,
  "nom": "toto",
  "bio": ""
}
```

On peut faire une parenthèse ici pour parler de ceux qui mettent tout en POST: "plus securisé, you know..."

=> Zero

# ressources & verbes

Identifier les ressources
Appliquer des opérations

ici slide sur les verbes
important de les utiliser a bon escient, de ne pas "tromper" l'utilisateur.

GET /speakers
POST /speakers => 200

GET /speakers/{id}
PUT /speakers/{id}
DELETE /speakers/{id}

[suite] regardons ce que ca donne sur les talks

POST /talks/{id}/noter/5

pb: 2 verbes (on ne comprend pas)
solution: sous-resources

POST /talks/{id}/notes -d {value: 5}

# codes retour

pb: suivre la spec HTTP - voir exemple sur POST
quel code mettre?
avant de voir ca, un peu de theorie
1xx Hold on
2xx Here you go
3xx Go away
4xx You fucked up
5xx I fucked up

- 2xx:
 - 200 ok
 - 201: created
 - 202: accepted (async)
 - 204: no content
 - 206: partial content


- bad input
 - 400: bad request
 - 412: preconditions failure
 - 422: semantic errors
- bad page / rights
 - 401: authentication failed
 - 403: bad authorisation
 - 404: not found
- bad request
 - 405: bad method
 - 406: bad content type
 - 415: bad accept / media type
- concurrency
 - 409: conflict
 - 423: lock
- rate limit
 - 429: too many request
- server error
 - 500: internal error
 - 503: service unavailable

Reprenons les methodes

La methode poste
spec HTTP de POST = 201 + header location ()

> If a resource has been created on the origin server, the response SHOULD be 201 (Created) and contain an entity which describes the status of the request and refers to the new resource, and a Location header (see section 14.30).

[w3c|http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.5]

POST /speakers => 201 + Location: /speakers/120 + retourne nouvelle entity `{"id": 120, "name": "toto"}`

Autres methodes
 PUT /speakers => 200
 POST /speakers => 201
 GET /speakers/{id} => 200
 PUT /speakers/{id} => 200
 DELETE /speakers/{id} => 204

Documenter aussi les codes d'erreur (Deplacer dans une section documentation?)
PUT /speakers/{id} => 200, 404, 400

gestion des erreurs:
retourner statut HTTP + body => sinon CURL ne le montre pas! <= pas le seul argument. + replique "je m'en fous j'utilise postman !"

# pagination

2 types
- liste de taille fixe: pagination par page
- stream: pagination par elements suivant

+ retourner 206: partial content
aussi filtre / tri / non detaillé


ajouter les infos sur les pages (courante, debut, fin, prochaine, ...)
2 methodes:
- dans les headers

```
Link: <https://api.github.com/user/repos?page=3&per_page=100>; rel="next",
<https://api.github.com/user/repos?page=50&per_page=100>; rel="last"
```

on aime pas car CURL ne le montre pas par defaut (pas convaincu par l'argument.  change d'outil!)

- dans le contenu. c'est:

# hypermedia level 1

=> utiliser des liens

* next/prev
* beginning/end
* ...


```json
{
  "page": 1,
  "size": 20,
  "first": 1,
  "last": 5,
  "total": 97,
  "items": [
    {"id": 100},
    {"id": 118},
    ...
  ]
}
```

Exemples :

* HAL: http://phlyrestfully.readthedocs.org/en/latest/halprimer.html#collections
* JSON-API: http://jsonapi.org/examples/#pagination

Differents formats existent: HAL, JSON-LD, Collections+JSON, Hydra, SIREN, NARWHL, JSON-API...


# versionning level 1

dans path
v1/speakers (GET)
```json
{"id": 1}
```

pb de securité / ajouter de l'anthropie dans les valeurs pour eviter le brut force

v2/speakers (GET)
```json
{"id": "u-u-i-d"}
```


# content negociation level 1

bad practice:
* /speakers/xml
* /speakers/json

Car:
* caching (comme d'hab)
* si je demande /speakers/yaml, comment est géré ce format non supporté ?

Le client demnde un format de representation

Accept: application/json; application/xml; application/yaml
si on doit en choisir qu'un: json (compatibilité javascript)

Si le serveur ne peut pas fournir au client la representation dans un des format demandé: 406 - not acceptable

Idem pour accept-encoding, accept-charset, accept-language
Egalement: la réponse doit être auto-descriptive: donner le content-type du contenu, la langue, encoding...

# versionning level 2

content type: (voir video https://apigility.org/ a 1 min 50)
GET http://example.com/speakers/1" => return application/vnd.speaker.v1+json
si erreur => return application/vdn.error.v1+json



# CORS (2min)

on developpe l'appli web
et mince, ca marche pas!!
http://blog.toright.com/wp-content/uploads/2013/03/cors_chrome_2-542x480.png

CORS DOIT etre supporté par votre serveur web (express, hapi, restlet framework, ...) / chiant a coder / plein de regles et spec c'est une spec quoi, pas super clair

# gestion des droits level 1

utiliser une solution d'authenticiation:
- simple (sans date d'expiration)
  - basic auth
  - api token
- avec expiration
  - oauth2 (pas tous)
  - json web token

souvent header ou query param


# hypermedia level2 (hateoas)

Hypermedia as the engine of application state

* unique (or few) entry point: `/`
* discover available operations by following the graph

```json
{
  "_links":[
    {"rel":"speakers", "href": "http://example.com/speakers", "method": "GET"},
    {"rel":"talks", "href": "http://example.com/talks", "method": "GET"},
  ]
}
```

call to rel `speakers`: `http://example.com/speakers`

```json
{
  "items": [
    {
      "id": 1,
      "nom": "toto",
      "bio": "",
      "_links":[
        {"rel":"self", "href": "http://example.com/speakers/1", "method": "GET"},
        {"rel":"delete", "href": "http://example.com/spearkers/1", "method": "DELETE"},
      ]
    },
    ...
  ]
}
```

Voir exemple en SIREN: https://github.com/kevinswiber/siren#example


# gestion des droits level 2 (bonus)

=> gestion des droits par le backend / le front end sait l'action "delete" est possible ou non pour la donnée et l'utilisateur
{"rel":"delete", title:"Delete speaker", "href": "http://example.com/spearkers/1", "method": "DELETE"},

# Versionning level 3

Ajout de transitions hypermedia vers des nouvelles features, tout en conservant les anciennes pour compat.

ex: TODO

# You're a Hero

share your swagger or raml
