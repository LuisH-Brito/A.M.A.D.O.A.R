# A.M.A.D.O.A.R

#Alguns comandos que devem ser rodados depois de clonar o repositorio

Abra o terminal na pasta do BACKEND
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install python-dotenv django-cors-headers
python manage.py migrate
python manage.py runserver

Comando para criar um superuser e acessar as coisa no http://127.0.0.1:8000/admin/

    -> python manage.py createsuperuser
    Ele vai pedir um nome, email e uma senha

abra a pasta do FRONTEND
npm install
ng serve

MUITO IMPORTANTE
-> antes de fazer qualquer coisa no backend ative o ambiente virtual
-> esse é o comando ó
-> venv\Scripts\activate
Pra saber se ele ativou é so olhar no cantinho da linha de comando vai ter la (venv) verdinho
NÃO ESQUEÇA DE JEITO NENHUM PLMDD

Pro banco funcionar deve ser criado um schema chamado "amadoar"

Além disso, para que as notificações por email funcionem é preciso abrir a pasta do BACKEND e criar
um arquivo chamado ".env" e colocar 2 variaveis com o email e a chave de 16 digitos do mesmo sem aspas:
EMAIL_USER=seuemail@exemplo.com
EMAIL_PASS=chave gerada pelo email


Para rodar o servidor backend
-> obs: tem que rodar ele dentro de backend
-> python manage.py runserver

Para rodar o servidor frontend
-> obs: tem que rodar dentro de frontend
-> ng serve


Para criar um app no django
-> obs: tem que rodar ele dentro de backend
-> python manage.py startapp nome_do_app
-> sempre que criar um app tem que adicionar ele no config/settings.py na parte de INSTALLED_APPS


Comandos do angular para criar

-> Um componente
-> ng g c componentes/nome-do-componente
-> esse comando vai criar um componente novo dentro da pasta componentes

-> Uma pagina
-> ng g c pages/nome-da-pagina
-> esse comando vai criar uma pagina nova dentro da pasta pages

-> Um service
-> ng g s services/nome-do-servico
-> esse comando vai criar um service novo dentro da pasta services

EXTRA: -> ng g c components/botao --dry-run  
 -> Mostra o que será criado sem criar de verdade

Comando para rodar o teste automatizado
-> obs: antes de rodar o comando deve intalar a biblioteca do playwright
    npm install -D @playwright/test
    npx playwright install
    
-> npx playwright test --headed
