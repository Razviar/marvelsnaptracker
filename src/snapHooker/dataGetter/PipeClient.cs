using System.Collections.Generic;
using System.IO;
using System.IO.Pipes;
using System.Text;
using System.Threading;

namespace DataGetter
{
    public class PipeClient
    {
        public List<string> Messages { get; set; }

        public NamedPipeClientStream Pipe { get; set; }

        public PipeClient()
        {
            Pipe = new NamedPipeClientStream("MarvelSnapPro");
            Pipe.Connect();
        }

        public void SendMessage(string message)
        {
            byte[] bytes = Encoding.UTF8.GetBytes(message + "\r\n");
            Pipe.WriteAsync(bytes, 0, bytes.Length);
        }

        public void ClientThread()
        {
            NamedPipeClientStream pipeClientStream = new NamedPipeClientStream("MarvelSnapPro");
            pipeClientStream.Connect();
            StreamWriter streamWriter = new StreamWriter(pipeClientStream);
            while (true)
            {
                IEnumerable<string> strings = null;
                lock (Messages)
                {
                    strings = Messages.ToArray();
                    Messages.Clear();
                }
                foreach (string str in strings)
                {
                    streamWriter.WriteLine(str);
                    streamWriter.Flush();
                }
                Thread.Sleep(100);
            }
        }
    }
}
