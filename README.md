# A.M.A.D.O.A.R

#Alguns comandos que devem ser rodados depois de clonar o repositorio

Abra o terminal na pasta do BACKEND
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

abra a pasta do FRONTEND
npm install
ng serve

MUITO IMPORTANTE
-> antes de fazer qualquer coisa no backend ative o ambiente virtual
-> esse é o comando ó
-> venv\Scripts\activate
Pra saber se ele ativou é so olhar no cantinho da linha de comando vai ter la (venv) verdinho
NÃO ESQUEÇA DE JEITO NENHUM PLMDD

Para criar um app no django
-> obs: tem que rodar ele dentro de backend
-> python manage.py startapp nome_do_app
-> sempre que criar um app tem que adicionar ele no config/settings.py na parte de INSTALLED_APPS

Para rodar o servidor
-> obs: tem que rodar ele dentro de backend
-> python manage.py runserver

Comandos do angular para criar

-> Um componente
-> ng g c components/nome-do-componente
-> esse comando vai criar um componente novo dentro da pasta componentes

-> Uma pagina
-> ng g c pages/nome-da-pagina
-> esse comando vai criar uma pagina nova dentro da pasta pages

-> Um service
-> ng g s services/nome-do-servico
-> esse comando vai criar um service novo dentro da pasta services

EXTRA: -> ng g c components/botao --dry-run  
 -> Mostra o que será criado sem criar de verdade
