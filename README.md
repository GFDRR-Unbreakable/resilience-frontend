# Unbreakable - GFDRR [Front-end Repository]

## Notes for deployment - to production

```bash
ssh -i "~/.ssh/Gfdrr.pem" ubuntu@ec2-<ip-address>.us-east-2.compute.amazonaws.com
cd src/resilience-frontend
git checkout origin/feature/phase-2
git fetch
git checkout origin/feature/phase-2
npm run build
sudo rm -rf /var/www/unbreakable-gfdrr/
sudo mkdir /var/www/unbreakable-gfdrr
sudo cp .htaccess /var/www/unbreakable-gfdrr/.htaccess
cd dist && sudo  cp -avr * /var/www/unbreakable-gfdrr
```
