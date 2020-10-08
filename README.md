# Unbreakable - GFDRR [Front-end Repository]

## Notes for deployment - to production server

### Generate Deploy Key

```bash
ssh-keygen -t rsa -b 4096 -C clanoue@graphicacy.com
cat /home/ubuntu/.ssh/id_rsa.pub
```

### Deploy Application

```bash
ssh -i "~/.ssh/Gfdrr.pem" ubuntu@ec2-<ip-address>.us-east-2.compute.amazonaws.com
cd src/resilience-frontend
git checkout origin/master
git fetch
git checkout origin/master
npm run build
sudo rm -rf /var/www/unbreakable-gfdrr/
sudo mkdir /var/www/unbreakable-gfdrr
sudo cp .htaccess /var/www/unbreakable-gfdrr/.htaccess
cd dist && sudo  cp -avr * /var/www/unbreakable-gfdrr
```
