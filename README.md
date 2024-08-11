<a name="readme-top"></a>

<div align="center">
<h3 align="center">ZStreamer</h3>

  <p align="center">
    A small proxy tool designed to reduce internet egress fees when downloading files from AWS S3.
    <br />
    <br />
    <a href="https://github.com/rorylshanks/zstreamer/issues">Report Bug</a>
    ·
    <a href="https://github.com/rorylshanks/zstreamer/issues">Request Feature</a>
  </p>
</div>

<!-- ABOUT THE PROJECT -->
## About The Project

ZStreamer is a proxy tool that helps reduce the costs associated with internet egress fees from AWS. When you download large files directly from S3 to a location outside AWS, you incur significant egress charges. ZStreamer mitigates these costs by running a small proxy on an EC2 instance within AWS, allowing you to download files from S3 through this proxy. The cost of running a small EC2 instance is often lower than the additional traffic fees, making this an economical solution for large data transfers.

Key benefits of ZStreamer include:

- **Cost-effective Data Transfers**  
  By routing your downloads through a small EC2 instance, you can significantly reduce the egress fees associated with large S3 downloads. We found normally we can reduce file sizes by on average 60%
  
- **Simple to Deploy**  
  The proxy is lightweight and easy to set up, allowing you to quickly start saving on your data transfer costs.

- **Automatic Recompression**  
  ZStreamer can recompress gzip files to ZSTD format on-the-fly, further reducing the amount of data that needs to be transferred over the internet.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## How It Works

ZStreamer acts as an intermediary between your client and AWS S3:

### Data Flow
1. **Client Requests a File**: The client sends a request to download a file from S3, specifying the bucket and key.
2. **Proxy Fetches the File from S3**: ZStreamer retrieves the file from S3. If the file is a gzip file, it can decompress it and then recompress it using ZSTD to save bandwidth. Otherwise it simply recompresses the file with zstd without decompressing it first.
3. **Data Sent to Client**: The proxy sends the file to the client, reducing the egress data transferred over the internet.

### Cost Savings
The primary cost-saving mechanism is through reducing egress fees by using a small EC2 instance to handle the downloads. The secondary savings come from compressing data more efficiently before it leaves the AWS network.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

To get started with ZStreamer, you can use the provided docker-compose file and simply run

```
docker compose up
```

You can then download any file from this by passing the desired bucket and key in the query string as below

```
curl --user admin:test "localhost:3000/download?bucket=test-bucket&key=test-file.gz"
```

## Required Permissions

When running in AWS, make sure that either the EC2 Instance Profile has access to the S3 bucket, or you can provide AWS credentials via the usual environment variables.

You can also specify a HTTP basic authentication username and password using the environment variables:

- `BASIC_AUTH_USERNAME`
- `BASIC_AUTH_PASSWORD`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---
