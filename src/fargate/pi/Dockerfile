FROM python:3.7-alpine
RUN python3.7 -m pip install boto3
EXPOSE 8000
WORKDIR /src
ADD . /src
CMD python3 index.py