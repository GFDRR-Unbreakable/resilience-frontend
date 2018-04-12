# ResilienceFrontend

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.0.6.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Additional notes
site was password protected following these instructions:

https://www.digitalocean.com/community/tutorials/how-to-set-up-password-authentication-with-apache-on-ubuntu-14-04

1) created .htpasswd file at /etc/apache2/.htpasswd 
-- Command: sudo htpasswd -c /etc/apache2/.htpasswd <username>

2) edited /etc/apache2/sites-enabled/000-default.conf to include:

-- NB: replaced pre-existing line "Require <something different>" with below; other flags weren't in there yet
-- set back to "Require all granted" to eliminate password protection

    <Directory "/var/www/html">
        AuthType Basic
        AuthName "Restricted Content"
        AuthUserFile /etc/apache2/.htpasswd
        Require valid-user
    </Directory>
    
3) Ran "sudo service apache2 restart" to reset 

To update packages: 
sudo apt-get dist-upgrade

To reboot node:
sudo reboot
