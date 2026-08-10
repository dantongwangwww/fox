FROM 11.11.140.163:30000/kld-ideas/nginx-curl:v1.18.0

COPY dist /usr/share/nginx/html

WORKDIR /usr/share/nginx/html
EXPOSE 8080
